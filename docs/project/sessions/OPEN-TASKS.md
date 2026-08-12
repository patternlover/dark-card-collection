# Task in sospeso (OPEN TASKS) — Dark Card Collection

Tracker persistente dei task aperti, a vita lunga (oltre la singola sessione). Ogni sessione deve **leggere questo file all'inizio** e **aggiornarlo alla fine**. Un task si chiude solo con verifica fatta (`pnpm lint`, `pnpm test`, build dove applicabile).

Stati: `open` · `in-progress` · `blocked` (con motivo) · `done` (con verifica).

Ultimo aggiornamento: 2026-08-12 (Fasi 1-5 + E2E 25/25 + **root cause Listino live RISOLTA**: schema drift `payload_locked_documents_rels.purchases_id` → 500 su ogni write; migration `20260812_fix_locked_documents_rels`; **drift-check live → NESSUNO** dopo `20260812_align_orders_stripe_session_index`; test live ok).

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

## E2E Dashboard (Playwright, locale) — 2026-08-12

Suite end-to-end in `tests-e2e/` (24 test) eseguita sul **bundle di produzione** (`next build` + `next start`) contro Postgres locale + auth bypass (cookie `dcc-dash` firmato). **24/24 verdi.**

| # | Task | Stato |
|---|------|-------|
| E1 | Ambiente E2E: Postgres locale (`dcc_test`), `.env.test`, seed (`scripts/test-db-setup.ts`), Playwright config, auth bypass | done |
| E2 | **Bug critico**: deadlock nella creazione di un lotto (hook `afterChange` Purchases → `payload.update` su products in transazione si blocca) → fix: applicazione stock/costo spostata dagli hook alle server actions (`createPurchase`/`deletePurchase` via `applyStockDelta`/`applyPurchaseDeletion`) | done (test lotti passano) |
| E3 | **Bug**: pulsante "Elimina prodotto" assente dopo il refactor Fase 3 → riaggiunto in Magazzino (`InventorySection`) | done |
| E4 | Test: auth gate, prodotti (crea/nascondi/mostra/modifica/featured/elimina), lotti (crea con righe+quick-create, stock, expand, elimina), categorie/collezioni CRUD, ordini (dettaglio canale+margine, status, vendita esterna), messaggi (read/replied/elimina), impostazioni (site+header) | done (24/24) |
| E5 | **Nota**: il dev server (`next dev`) mostra remount del componente durante l'interazione (artefatto HMR): sul bundle prod assente. Per suite stabile usare `next build && next start` | open (info) |
| E6 | **Nota**: su `/shop` si osserva un doppio render transitorio della card prodotto durante il caricamento (hydration/streaming) → i test usano `.first()`; da verificare se cosmetico anche su rete reale | open (info) |
| E7 | **Gap funzionale**: in `/dashboard/purchases` non esiste la **modifica di un lotto** (solo crea/elimina/espandi). Se serve, aggiungere edit UI | open (feature request) |
| E8 | **Non coperto da E2E**: console SQL (`/dashboard/sql`, dipende da `ENABLE_DASH_SQL`) e panorama `/dashboard` (solo heading) | open (copertura) |
| E9 | **Listino live non aggiornava i dati** — **ROOT CAUSE RISOLTA (2026-08-12)**: `payload_locked_documents_rels` sul DB live mancava di `purchases_id` → ogni write Payload (lock check) falliva con `column ...purchases_id does not exist` → HTTP 500 (e il #441 era la coda dello stato rotto). Fix: migration `20260812_fix_locked_documents_rels.ts` (colonna+FK+indice). Verificato live con `tests-e2e-live/prod.spec.ts`: toggle/featured/edit/create/delete ok, FAILING_WRITES [], CONSOLE_ERRORS [] | done (verificato in prod) |

## Deferred / Blocked

| # | Task | Stato |
|---|------|-------|
| 20 | **Test-infra**: fix `localStorage is not defined` — risolto con polyfill in `tests/setup.ts` (root cause: getter sperimentale Node 26 che torna `undefined` senza `--localstorage-file`) | done (`pnpm test` 44/44) |
| 21 | **Validazione migration** `20260812_purchases_lines_schema.ts` — **VALIDATA** localmente su entrambi i percorsi: schema push (idempotente, 2 esecuzioni OK) e schema flat legacy (backfill flat→lines OK, script `scripts/validate-migration-*.ts`). Fix aggiunti: vincoli FK in blocco `DO` (Postgres non ha `ADD CONSTRAINT IF NOT EXISTS`) e backfill condizionato alla presenza di `linked_product_id` | done |
| 22 | **Data-cleanup legacy** (sessione dedicata, come deciso 2026-08-12): merge fake variants (stesso title, differenze solo costo/qty), Purchases retroattive (`source_name: "legacy"`), dedup, verifica PDP/sitemap/Merchant | open (sessione dedicata) |
