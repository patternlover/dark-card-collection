# Analytics — Looker Studio (viste SQL su Medusa)

Viste SQL read-only sul DB Medusa (`dcc_medusa`, Neon) per l'analisi in **Looker Studio (ex Data Studio)**.

## Setup (una tantum)

```bash
node scripts/analytics/setup.js
```

Crea:
- ruolo **`medusa_ro`** (sola lettura) con password casuale → salva la connection string completa in **`scripts/analytics/.env`** (gitignored, NON committato);
- le viste: `v_orders`, `v_orders_margin`, `v_orders_items_raw`, `v_variants_cost`.

## Viste

| Vista | Contenuto |
|---|---|
| `v_orders` | ordini per testata: display_id, status, email, **sales_channel** (website/vinted/ebay/cardmarket/altro), total/subtotal/shipping/tax in €, created_at |
| `v_orders_margin` | per ordine: total_eur, **cost_fifo_eur** (da `metadata.dcc_cost_snapshots`), **margin_eur** |
| `v_orders_items_raw` | **dati raw**: ordine + righe (product_title, variant, qty, unit_price_eur, line_total_eur, collection, type, metadata) |
| `v_variants_cost` | prodotto/variante: price_eur, **cost_of_goods_sold_eur** (costo medio FIFO), stock_qty (livelli attivi) |

> Importi già convertiti in **euro** (Medusa usa i centesimi). I `metadata` JSONB (snapshot costi, attributi) sono già "spiegati" nelle viste o esposti come colonna `order_metadata`.

## Collegamento a Looker Studio

1. **Looker Studio → Crea → Sorgente dati → PostgreSQL**.
2. Dalla `DATABASE_URL_RO` in `scripts/analytics/.env` ricava:
   - **Server/host**: `ep-xxxx.eu-central-1.aws.neon.tech` (parte `@host` della stringa)
   - **Porta**: `5432`
   - **Database**: `dcc_medusa`
   - **Nome utente**: `medusa_ro`
   - **Password**: quella in `scripts/analytics/.env`
   - **SSL**: abilitato (Neon richiede `sslmode=require`)
3. Aggiungi le viste come sorgenti (o usa **Custom Query**).
4. Suggerimenti report: ordini per canale (v_orders) · margine per canale/prodotto (v_orders_margin) · sell-through per lotto (join con purchase_lot/line se serve).

## Note

- **Read-only**: `medusa_ro` ha solo `SELECT` su tabelle e viste.
- **Non usare Redis** per analytics: è cache/event bus (dati effimeri).
- Lo storico Payload (altro DB Neon) è legacy e separato.
- Il password del ruolo è rigenerabile rieseguendo `setup.js` (aggiorna `scripts/analytics/.env`).