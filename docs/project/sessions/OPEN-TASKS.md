# Task in sospeso (OPEN TASKS) — Dark Card Collection

Tracker persistente dei task aperti, a vita lunga (oltre la singola sessione). Ogni sessione deve **leggere questo file all'inizio** e **aggiornarlo alla fine**. Un task si chiude solo con verifica fatta (`pnpm lint`, `pnpm test`, build dove applicabile).

Stati: `open` · `in-progress` · `blocked` (con motivo) · `done` (con verifica).

Ultimo aggiornamento: 2026-08-12 (Fasi 1-5 completate · test 44/44 · commit `c8a5981` pushato, CI verde, deploy live verificato · resta solo il data-cleanup legacy).

---

## Fase 4 — Storefront: filtro `sold` + "Esaurito"

| # | Task | Stato |
|---|------|-------|
| 14 | Filtri → `status in [listed, hold, sold] AND is_visible` su shop, new-arrivals, categories, collections, PDP, FeaturedProducts, llms-full; bestsellers + is_visible; sitemap allineato | done |
| 15 | "Esaurito": ProductCard badge + QuickAdd disabilitato; PDP non più `notFound()` per sold; Badge `sold-out` usata | done |
| 16 | ATC: AddToCartButton/QuickAddButton/StickyAddToCart disabilitati a stock 0 (fix clamp `Math.max(1,…)`) | done (`pnpm lint` ✓ · `pnpm test` 33 pass) |

---

## Fase 2 — Pipeline vendite condivisa `recordSale`

| # | Task | Stato |
|---|------|-------|
| 1 | Creare `src/lib/record-sale.ts`: `allocateFifo` (pura, oldest-first su remaining_quantity), snapshot `effective_unit_cost` su order items, decremento stock, auto `sold`/`out_of_stock` | done (test `record-sale` 9/9) |
| 2 | Refactor `src/app/api/stripe/webhook/route.ts` → usa `recordSale` (channel `website`, idempotenza su `stripe_session_id` invariata) | done |
| 3 | **Fix bug latente FK**: riga "spedizione" del webhook con `product: 0` viola `orders_items_product_id_products_id_fk` → non mettere la spedizione in `items`, usare il campo `shipping` | done |
| 4 | Refactor `recordExternalSale` in `src/app/dashboard/actions.ts` → usa `recordSale`; **fix campi out-of-schema** (email required, status `'completed'` fuori enum → `paid`, items senza `title`, + `sales_channel`) | done |
| 5 | `ExternalSaleModal`: piattaforme allineate all'enum `vinted|ebay|cardmarket|other` (wallapop/subito → other) | done |
| 6 | Test unitari `record-sale`/FIFO (`tests/record-sale.test.ts`) + `pnpm lint` + `pnpm test` | done (`pnpm lint` ✓ · `pnpm test` 33 pass, 9 pre-esistenti rossi) |

## Fase 3 — Dashboard: rotte + sezioni

| # | Task | Stato |
|---|------|-------|
| 7 | Rotte: `acquisti→purchases`, `ordini→orders`, `messaggi→messages`; nuovi `inventory` + `listings` (sostituiscono `/dashboard/prodotti`) | done |
| 8 | `DashboardShell` nav: Lotti / Magazzino / Listino / Ordini / Messaggi | done |
| 9 | `PurchasesSection` riscritta: lotto header (purchase_date, source_type, source_name, extra_costs, notes) + righe (pick prodotto o quick-create, qty, unit_cost) | done |
| 10 | `InventorySection` (Magazzino): stock, costo medio, valore, history acquisti | done |
| 11 | `ListingsSection` (Listino): price, sale_price, status, is_visible, featured | done |
| 12 | `OrdersSection`: colonna `sales_channel`, margine (`value − Σ unit_cost_snapshot×qty`), "Registra vendita esterna" | done |
| 13 | `actions.ts`: riscrittura `getPurchases`/`createPurchase`/`deletePurchase` per nuovo modello (**sistema il break runtime di Fase 1**), `getPurchaseHistory`, margine in `toOrderDTO` | done (`pnpm lint` ✓ · `pnpm test` 33 pass) |
| 13b | Cleanup: `ProductsSection.tsx`, `ProductTable.tsx`, `ProductGroupRow.tsx`, `ExternalSaleModal.tsx` (codice morto) rimossi | done |

## Fase 4 — Storefront: filtro `sold` + "Esaurito"

| # | Task | Stato |
|---|------|-------|
| 14 | Filtri → `status in [listed, hold, sold] AND is_visible` su shop, new-arrivals, categories, collections, PDP, FeaturedProducts, llms-full; bestsellers + is_visible; sitemap allineato | done |
| 15 | "Esaurito": ProductCard badge + QuickAdd disabilitato; PDP non più `notFound()` per sold; Badge `sold-out` usata | done |
| 16 | ATC: AddToCartButton/QuickAddButton/StickyAddToCart disabilitati a stock 0 (fix clamp `Math.max(1,…)`) | done (`pnpm lint` ✓ · `pnpm test` 33 pass) |

## Fase 5 — Test, tipi, docs

| # | Task | Stato |
|---|------|-------|
| 17 | Test aggiornati (group-products, sticky-add-to-cart per sold/stock 0) | done |
| 18 | Docs: `overview.md` (Purchases implementato, schema Orders, Known Issues, File Structure), `docs/database/schema-and-flows.md`, `docs/project/changelog.md`, session plan/changelog | done |
| 19 | Housekeeping: indice `sessions/README.md` con la sessione mancante `2026-08-10-purchases-and-external-sales.md` + riferimento a OPEN-TASKS | done |

## Deferred / Blocked

| # | Task | Stato |
|---|------|-------|
| 20 | **Test-infra**: fix `localStorage is not defined` — risolto con polyfill in `tests/setup.ts` (root cause: getter sperimentale Node 26 che torna `undefined` senza `--localstorage-file`) | done (`pnpm test` 44/44) |
| 21 | **Validazione migration** `20260812_purchases_lines_schema.ts` su DB reale (CI/build con Postgres) — **VERIFICATA** nella CI del commit `c8a5981` (build con `payload migrate` verde su Postgres 16) | done |
| 22 | **Data-cleanup legacy** (sessione dedicata, come deciso 2026-08-12): merge fake variants (stesso title, differenze solo costo/qty), Purchases retroattive (`source_name: "legacy"`), dedup, verifica PDP/sitemap/Merchant | open (sessione dedicata) |
