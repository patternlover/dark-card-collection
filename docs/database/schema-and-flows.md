# Guida Database & Flussi — Dark Card Collection (Medusa)

Guida leggibile dello schema dati **Medusa** (PostgreSQL su Neon, DB `dcc_medusa`) e dei flussi principali.
Lo schema è generato da Medusa (migration in `apps/backend`); la fonte di verità per i custom è il modulo `procurement`.

---

## 1. Panoramica

- **ORM**: MikroORM (Medusa v2, schema generato con `npx medusa db:generate <module>` + `db:migrate`).
- **Database**: PostgreSQL su Neon (DB `dcc_medusa`, SEPARATO dal vecchio DB Payload).
- **Redis**: self-hosted (event bus, workflow engine, cache).
- **Custom**: modulo `procurement` (lotti/FIFO/costo medio) + subscriber `order.placed`.

## 2. Schema (tabelle principali)

### Catalogo e prezzi
| Tabella | Note |
|---|---|
| `product` | title, handle (slug), status (draft/published), description, metadata (condition/grade/language/sale_price/cost_of_goods_sold…), thumbnail |
| `product_variant` | 1 per sealed ("Default"); `sku`, `manage_inventory`; `metadata.cost_of_goods_sold` = costo medio FIFO |
| `product_option` / `product_option_value` | opzioni visibili (per future varianti grade/condition/language) |
| `product_category` | categorie (es. "Sealed"), `handle` = slug |
| `product_collection` | collezioni/espansioni, `handle` = slug (route `/shop/espansioni/[handle]`) |
| `product_variant_inventory_item` | link variant ↔ inventory item (per lo stock) |
| `price_set` / `price` | prezzi per currency/region (importi in **centesimi**) |

### Region / Sales channel / Inventory
| Tabella | Note |
|---|---|
| `region` | "Italia" (EUR, country `it`), payment_providers (`pp_stripe_stripe`, `pp_system_default`) |
| `sales_channel` | **Website** (storefront) + **Vinted / eBay / Cardmarket / Altro** (vendite esterne) |
| `stock_location` | "Magazzino IT" |
| `inventory_item` / `inventory_level` | stock per location (`stocked_quantity`) |

### Cart / Order / Payment / Customer
| Tabella | Note |
|---|---|
| `cart` | carrello server-side (`region_id`, `email`, `items` via `cart_item`) |
| `order` | ordine (`display_id`, `status`, `email`, `metadata.dcc_cost_snapshots`) |
| `order_item` (line items) | qty, unit_price, variant_id |
| `payment_collection` / `payment_session` | sessione Stripe (`data.client_secret`) |
| `customer` / `auth_identity` | clienti registrati (login via `/auth/customer/emailpass`) |
| `shipping_option` / `fulfillment_set` / `service_zone` | spedizioni (Standard €9,99 / Gratuita €0) |

### Custom: modulo `procurement`
| Tabella | Note |
|---|---|
| `purchase_lot` | lotto: `purchase_date`, `source_type`, `source_name`, `extra_costs`, `notes`, `receipt_url`, `total_cost` |
| `purchase_line` | riga lotto: `variant_id`, `quantity`, `unit_cost`, `effective_unit_cost`, `remaining_quantity` (FIFO) |

## 3. Flussi

### 3.1 Acquisto storefront (checkout — **PAUSATO**)
1. `CartProvider` crea/aggiorna il carrello Medusa (`/store/carts`).
2. `/api/medusa/checkout` (Next): spedizione → payment collection → payment session Stripe → `client_secret`.
3. Pagina checkout monta il **Payment Element** e conferma; poi polling del carrello per l'order id → `/checkout/success`.
4. Il webhook Stripe completa l'ordine; il subscriber `order.placed` salva lo snapshot costo FIFO e invia l'email.

### 3.2 Vendita esterna (Admin → Ordini → Vendita esterna)
1. Workflow `record-external-sale` (Admin API `/admin/external-sales`).
2. FIFO `remaining_quantity` consumate (oldest-first) → snapshot su `order.metadata.dcc_cost_snapshots`.
3. Ordine `completed` sul sales channel esterno; stock↓. MAI pushata in GA4.

### 3.3 Lotto (Admin → Lotti)
1. Crea lotto con righe → `effective_unit_cost` calcolato pro-quota.
2. Inventory↑ e `variant.metadata.cost_of_goods_sold` ricalcolato (media pesata del residuo).
3. `total_cost` = Σ(qty×unit_cost) + extra_costs.

### 3.4 Magazzino / Listino (Admin)
- **Magazzino**: stock, costo medio, storico acquisti per variant (`/admin/variants/:id/lots`).
- **Listino**: prezzo/status/visibilità; stock 0 → frontend "Esaurito"; nascondere = `draft`.

### 3.5 Account cliente (storefront `/account`)
- Register: `/auth/customer/emailpass/register` + `/store/customers`; Login: `/auth/customer/emailpass`.
- Storico ordini: `/store/orders` (Bearer token).

## 4. Importi
Gli importi Medusa sono in **centesimi** (minor unit). Lo storefront li converte (/100) nell'adapter `src/lib/medusa/products.ts` e in `cart.ts`.

## 5. Migrazioni / Seed
- `npx medusa db:migrate` crea le tabelle + esegue i migration-script (incluso il seed: region Italia, 5 sales channel, location Magazzino IT, publishable API key, shipping options, demo product).
- Backup: `apps/backend/scripts/backup-medusa.sh` (pg_dump del DB Neon su VPS, cron).