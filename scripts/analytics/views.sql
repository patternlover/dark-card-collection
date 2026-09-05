-- Viste SQL per Looker Studio (analytics) — Dark Card Collection
-- Eseguite da scripts/analytics/setup.js (oppure a mano sul DB dcc_medusa).

-- 1) v_orders — ordini a livello testata (canale, totale, data)
CREATE OR REPLACE VIEW v_orders AS
SELECT
  o.id                                                       AS order_id,
  o.display_id,
  o.status,
  o.email,
  sc.name                                                   AS sales_channel,
  (os.totals->>'total')::numeric / 100                      AS total_eur,
  (os.totals->>'subtotal')::numeric / 100                   AS subtotal_eur,
  (os.totals->>'shipping_total')::numeric / 100             AS shipping_eur,
  (os.totals->>'tax_total')::numeric / 100                  AS tax_eur,
  o.created_at,
  o.customer_id
FROM "order" o
LEFT JOIN sales_channel sc ON sc.id = o.sales_channel_id
LEFT JOIN order_summary os ON os.order_id = o.id AND os.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- 2) v_orders_margin — ricavo, costo FIFO (da metadata.dcc_cost_snapshots), margine per ordine
CREATE OR REPLACE VIEW v_orders_margin AS
SELECT
  o.id                                                       AS order_id,
  o.display_id,
  o.status,
  o.email,
  sc.name                                                   AS sales_channel,
  (os.totals->>'total')::numeric / 100                      AS total_eur,
  COALESCE((
    SELECT sum((snap->>'quantity')::numeric * (snap->>'unit_cost_snapshot')::numeric)
    FROM jsonb_array_elements(o.metadata->'dcc_cost_snapshots') snap
  ), 0)                                                     AS cost_fifo_eur,
  ((os.totals->>'total')::numeric / 100)
    - COALESCE((
        SELECT sum((snap->>'quantity')::numeric * (snap->>'unit_cost_snapshot')::numeric)
        FROM jsonb_array_elements(o.metadata->'dcc_cost_snapshots') snap
      ), 0)                                                 AS margin_eur,
  o.created_at
FROM "order" o
LEFT JOIN sales_channel sc ON sc.id = o.sales_channel_id
LEFT JOIN order_summary os ON os.order_id = o.id AND os.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- 3) v_orders_items_raw — dati RAW (testata + righe, senza aggregazioni)
CREATE OR REPLACE VIEW v_orders_items_raw AS
SELECT
  o.id                                                       AS order_id,
  o.display_id,
  o.status                                                   AS order_status,
  o.email,
  sc.name                                                   AS sales_channel,
  o.created_at,
  li.id                                                      AS line_item_id,
  li.product_title,
  li.variant_title,
  li.variant_sku,
  li.variant_id,
  li.product_collection,
  li.product_type,
  oi.quantity,
  oi.unit_price::numeric / 100                              AS unit_price_eur,
  (oi.quantity * oi.unit_price)::numeric / 100              AS line_total_eur,
  o.metadata                                                AS order_metadata
FROM "order" o
LEFT JOIN sales_channel sc ON sc.id = o.sales_channel_id
LEFT JOIN order_item oi ON oi.order_id = o.id AND oi.deleted_at IS NULL
LEFT JOIN order_line_item li ON li.id = oi.item_id AND li.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- 4) v_variants_cost — prodotto/variante + costo medio + prezzo + stock
CREATE OR REPLACE VIEW v_variants_cost AS
SELECT
  p.id                                                       AS product_id,
  p.title                                                    AS product_title,
  p.handle                                                   AS product_handle,
  p.status                                                   AS product_status,
  v.id                                                       AS variant_id,
  v.title                                                    AS variant_title,
  v.sku                                                      AS variant_sku,
  NULLIF(v.metadata->>'cost_of_goods_sold','')::numeric     AS cost_of_goods_sold_eur,
  pr.amount::numeric / 100                                  AS price_eur,
  COALESCE(sum(il.stocked_quantity), 0)                     AS stock_qty,
  v.created_at
FROM product p
JOIN product_variant v ON v.product_id = p.id AND v.deleted_at IS NULL
LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = v.id
LEFT JOIN price pr
  ON pr.price_set_id = pvps.price_set_id
  AND pr.currency_code = 'eur'
  AND pr.price_list_id IS NULL
  AND pr.deleted_at IS NULL
LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = v.id
LEFT JOIN inventory_item ii ON ii.id = pvii.inventory_item_id
LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id AND il.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.handle, p.status, v.id, v.title, v.sku, v.metadata, pr.amount, v.created_at;