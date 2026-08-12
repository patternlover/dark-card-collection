# Sessione 2026-08-12 — Allineamento progetto a AGENTS.md / overview.md

## Plan (pre-lavoro)

**Obiettivo**: allineare TUTTO il progetto (collections, pipeline vendite, dashboard, storefront, test, docs) al modello target di AGENTS.md + overview.md § "Domain Model & Inventory Flow". Sessioni in sequenza: questa copre Fase 1 (modello dati Payload).

**Decisioni prese (interazione con l'utente)**:
- Merge dati legacy (fake variants, Purchases retroattive) → **sessione dedicata**, fuori scope.
- Purchases `status` (received/pending/archived) → **eliminato** (schema allineato ai doc).
- `sales_channel` enum = `website|vinted|ebay|cardmarket|other`; wallapop/subito/altro mappano su `other`.
- Dashboard: split `/dashboard/prodotti` → `/dashboard/inventory` + `/dashboard/listings`; rename `acquisti→purchases`, `ordini→orders`, `messaggi→messages`.

**Ambito Fase 1 — Modello dati Payload**:
1. Riscrittura `src/payload/collections/Purchases/index.ts`:
   - drop `title`, `cost_of_goods_sold`, `quantity`, `store`, `linked_product`, `status`
   - add `purchase_date` (required), `source_type` (select newsstand/supermarket/shop/online/private/other), `source_name`, `extra_costs` (default 0), `notes`, `lines` array (`product` rel, `quantity`, `unit_cost`, `effective_unit_cost`, `remaining_quantity`), `total_cost` (derived)
   - hook `beforeChange`: `effective_unit_cost = unit_cost × (1 + extra_costs/subtotal)`, edge subtotal 0 → `extra_costs/Σqty`; `remaining_quantity` init = quantity; `total_cost`.
   - hook `afterChange`: incrementa stock dei product, ricalcola `cost_of_goods_sold` (media pesata), ripristina `listed`+`in_stock` se stock > 0.
2. `src/payload/collections/Orders/index.ts`: add `sales_channel` (select), `unit_cost_snapshot` in `items[]`.
3. `src/payload/collections/Products/index.ts`: `cost_of_goods_sold` → `admin.readOnly`; hook `beforeChange` auto `status`/`availability` da quantity.
4. `payload generate:types` + migration manuale (`payload migrate:create`): alter `purchases`, `orders.sales_channel`, `orders_items.unit_cost_snapshot`, backfill flat→lines.

**File coinvolti**: i 3 file collection sopra, `src/migrations/index.ts` + nuova migration, `src/payload-types.ts` (generato), docs.

**Verifica prevista**: `pnpm lint`, `pnpm test`, `payload generate:db-schema && payload migrate`, build.

## Changelog (post-lavoro)

### Fase 1 — Modello dati Payload (completata 2026-08-12)

1. **`src/payload/collections/Purchases/index.ts`** riscritta allo schema target: drop di `title`, `cost_of_goods_sold`, `quantity`, `store`, `linked_product`, `status`; add di `purchase_date` (required), `source_type` (select), `source_name`, `extra_costs`, `notes`, `lines[]` (`product` rel, `quantity`, `unit_cost`, `effective_unit_cost`, `remaining_quantity`) e `total_cost`. Hook `beforeChange` (calcola `effective_unit_cost` e `total_cost`, init `remaining_quantity`), `afterChange` (stock delta + `cost_of_goods_sold` medio pesato + auto ripristino `listed`/`in_stock` via hook Products), `afterDelete` (decremento dello stock residuo).
2. **`src/payload/collections/Orders/index.ts`**: add `sales_channel` (select `website|vinted|ebay|cardmarket|other`, default `website`) e `unit_cost_snapshot` in `items[]`.
3. **`src/payload/collections/Products/index.ts`**: `cost_of_goods_sold` → `admin.readOnly`; hook `beforeChange` auto status/availability da quantity (0 → `sold`+`out_of_stock`; >0 da `sold` → `listed`, availability `in_stock`/`preorder` da `is_preorder`).
4. **Nuovi lib**: `src/lib/purchase-math.ts` (funzioni pure: `computeEffectiveUnitCosts`, `computeAverageCost`, `roundMoney`), `src/lib/inventory.ts` (helper DB: `productIdFrom`, `purchaseStockDelta`, `recomputeAverageCost`, `applyStockDelta`).
5. **Tipi**: `payload generate:types` rigenerato (Purchase con `lines`, Order con `sales_channel`/`unit_cost_snapshot`).
6. **Migration**: `src/migrations/20260812_purchases_lines_schema.ts` (schema identico a `payload-generated-schema.ts` + backfill flat→lines per i purchases esistenti + `sales_channel`/`unit_cost_snapshot` + drop colonne legacy), registrata in `src/migrations/index.ts`.
7. **Test**: nuovo `tests/purchase-math.test.ts` (7 test: allocation pro-rata, edge subtotal 0, average cost, roundMoney).

**Verifica Fase 1**: `pnpm lint` ✅ · `pnpm test` — 24/26 passano (7 nuovi + 17 esistenti); **9 failure pre-esistenti** su `cart.test.tsx` e `sticky-add-to-cart.test.tsx` (`localStorage is not defined`) confermati anche a HEAD pulito (`git stash`): incompatibilità ambiente vitest 4.1.10 + happy-dom 20.11.1 su questa macchina (happy-dom espone `localStorage`, ma l'ambiente vitest non lo copia sul global). **Non correlati a Fase 1** — da risolvere come task di test-infra separato.

**Note per le fasi successive**:
- Dashboard Acquisti (`actions.ts` getPurchases/createPurchase + PurchasesSection) è ora **incompatibile a runtime** col nuovo schema (usa `as any` quindi compila, ma scriverebbe campi inesistenti) — il refactor è in **Fase 3**.
- La migration verrà validata da CI/build (Postgres) — non applicabile in locale (niente DB).
- Build: `payload generate:db-schema && payload migrate` — `payload-generated-schema.ts` gitignored.

### Fase 2 — Pipeline vendite condivisa `recordSale` (completata 2026-08-12)

1. **`src/lib/record-sale.ts`** (nuovo): `allocateFifo` (pura, oldest-first su `remaining_quantity`, sort per `purchase_date` poi line id), `weightedAverageSnapshot`, e `recordSale(payload, args)` che: crea l'Order con schema corretto (`sales_channel`, `status: 'paid'`, items con `unit_cost_snapshot` = media pesata FIFO o fallback `cost_of_goods_sold`), decrementa `Products.quantity` (l'hook Products auto-setta `sold`/`out_of_stock` a 0), e consuma le righe `remaining_quantity` per acquisto.
2. **`src/app/api/stripe/webhook/route.ts`**: refactor → usa `recordSale` (channel `website`); **fix FK**: la riga spedizione non entra più in `items` (prima `product: 0` violava `orders_items_product_id_products_id_fk`), va nel campo `shipping`; email conferma ordine usa i titoli dal risultato di `recordSale`; idempotenza su `stripe_session_id` invariata.
3. **`src/app/dashboard/actions.ts`**: `recordExternalSale` riscritta su `recordSale` con `normalizeChannel` (vinted→vinted, ebay→ebay, cardmarket→cardmarket, wallapop/subito/altro→other); **fix out-of-schema**: `email` obbligatoria (`ext-{channel}@darkcardcollection.com`), `status: 'paid'` (niente più `'completed'`), items senza `title`, niente `customer_name`/`customer_email`.
4. **`src/components/dashboard/ExternalSaleModal.tsx`**: piattaforme `vinted|ebay|cardmarket|other` (rimossi wallapop/subito, mappati su `other`).
5. **Test**: `tests/record-sale.test.ts` (9 test: FIFO oldest-first/parziale/null-date, weighted avg, recordSale end-to-end con mock — snapshot 26.25, stock 8→2, righe consumate, fallback costo legacy, dedup items).

**Verifica Fase 2**: `pnpm lint` ✅ · `pnpm test` — 33/42 passano (+9 nuovi); restano i **9 failure pre-esistenti** di cart/sticky-add-to-cart (localStorage, task OPEN-TASKS #20).

### Fase 3 — Dashboard: rotte + sezioni (completata 2026-08-12)

1. **Rotte**: `acquisti→purchases`, `ordini→orders`, `messaggi→messages` (git mv); nuovi `inventory` (Magazzino) e `listings` (Listino) al posto di `/dashboard/prodotti`.
2. **`DashboardShell`**: nav Lotti / Magazzino / Listino / Ordini / Messaggi (+ Categorie, Collezioni, Impostazioni, SQL).
3. **`actions.ts`**: riscritte `getPurchases`/`createPurchase`/`deletePurchase` per il nuovo modello (PurchaseDTO con `lines[]`, `purchase_date`/`source_type`/`source_name`/`extra_costs`/`total_cost`; createPurchase con righe {product esistente o quick-create, qty, unit_cost}); nuovo `getPurchaseHistory(productId)`; `toOrderDTO` + `sales_channel` + `margin` (`value − Σ unit_cost_snapshot×qty`); `OrderItemDTO.unitCostSnapshot`. **Risolto il break runtime di Fase 1**.
4. **`PurchasesSection`** riscritta: tabella lotti espandibile (righe, costi, residui) + modale "Registra Nuovo Lotto" con header (data, source_type, source_name, extra_costs, notes) e righe (select prodotto esistente o "nuovo prodotto" con titolo/prezzo/categoria/collezione/immagine + qty + costo unitario).
5. **`InventorySection`** (Magazzino): stock, costo medio, prezzo, valore inventario + drill-down "Storico acquisti" (getPurchaseHistory) + Nuovo Prodotto (CreateProductModal).
6. **`ListingsSection`** (Listino): prezzo, barrato, stato, disponibilità, toggle visibilità (`is_visible`), toggle vetrina (`featured`), edit (EditProductModal).
7. **`OrdersSection`**: colonna Canale + Margine (rosso se negativo), dettaglio con `unit_cost_snapshot`, bottone "Registra Vendita Esterna" (pick prodotto → recordExternalSale).

**Verifica Fase 3**: `pnpm lint` ✅ · `pnpm test` — 33/42 (invariato, 9 pre-esistenti rossi). Nota: `ProductsSection.tsx`/`ProductTable.tsx`/`ProductGroupRow.tsx` sono ora **codice morto** (cleanup in Fase 5, task 13b).

### Fase 4 — Storefront: filtro `sold` + "Esaurito" (completata 2026-08-12)

1. **Filtri storefront** → `status in [listed, hold, sold] AND is_visible` in: `shop/page.tsx`, `new-arrivals`, `categories/[slug]`, `collections/[slug]`, PDP (metadata + query + variants + related con `is_visible` aggiunto), `FeaturedProducts`, `llms-full.txt`; `bestsellers` allineato (aggiunto `is_visible`, status in [listed,hold,sold]); `sitemap.ts` allineato (stesso filtro).
2. **"Esaurito"**: `ProductCard` badge `sold-out` quando `group.totalQuantity <= 0` (QuickAdd non renderizzato per sold); PDP non fa più `notFound()` per i `sold` (rende la pagina con badge "Esaurito", JsonLd OutOfStock, ATC disabilitato); `statusLabels` PDP sold → 'Esaurito'.
3. **ATC a stock 0**: `QuickAddButton` disponibile solo con stock > 0 (`availableQty > 0`, rimosso clamp `Math.max(1,…)`); `AddToCartButton` disabilitato e "Non disponibile" quando `maxQuantity <= 0`; `StickyAddToCart` PDP riceve `maxQuantity={group.totalQuantity}` (niente più clamp a 1).

**Verifica Fase 4**: `pnpm lint` ✅ · `pnpm test` — 33/42 (invariato, 9 pre-esistenti rossi).

### Fase 5 — Test, infra, cleanup, docs (completata 2026-08-12)

1. **Fix test-infra (task #20)**: root cause trovata — Node 26 espone `localStorage`/`sessionStorage` come getter sperimentale che torna `undefined` senza `--localstorage-file`; vitest 4 non eredita quelli di happy-dom. Fix: `tests/setup.ts` con polyfill in-memory registrato in `vitest.config.ts` (`setupFiles`). **Tutti i 9 test pre-esistenti rossi ora passano.**
2. **Test aggiornati (task 17)**: nuovi casi sold/stock-0 in `sticky-add-to-cart.test.tsx` (status sold + maxQuantity 0 → "Non disponibile" + bottone disabilitato) e `cart.test.tsx` (QuickAddButton nascosto a stock 0). `pnpm test` → **44/44 ✅**.
3. **Cleanup (task 13b)**: rimossi `ProductsSection.tsx`, `ProductTable.tsx`, `ProductGroupRow.tsx`, `ExternalSaleModal.tsx` (codice morto).
4. **Docs (task 18)**: `overview.md` (STATUS implemented, Purchases non più "(to create)", File Structure dashboard/lib/migrations, Known Issues #10), `docs/database/schema-and-flows.md` (stato 2026-08-12, purchases 2.8, orders sales_channel/unit_cost_snapshot, regole stock/status, flussi recordSale, dashboard, roadmap), `docs/project/changelog.md` (sessione 9), sessions README indice.
5. **Tracker (task 19 + 20)**: OPEN-TASKS aggiornato.

**Verifica Fase 5**: `pnpm lint` ✅ · `pnpm test` **44/44 ✅**.

### Fase 6 — E2E Dashboard (Playwright, locale) — bugtesting completo (2026-08-12)

1. **Ambiente E2E**: Postgres locale via brew (`dcc_test`), `.env.test` (gitignored, solo valori locali), `scripts/test-db-setup.ts` (init Payload con schema push + reset + seed), `@playwright/test` + chromium, `playwright.config.ts` (webServer con env test, auth bypass via cookie `dcc-dash` firmato con `signToken`), `tests-e2e/` con 24 test.
2. **Bug critico trovato e risolto**: creare un lotto si bloccava (deadlock) — l'hook `afterChange` di `Purchases` chiamava `payload.update` su `products` dentro la transazione. **Fix**: spostata l'applicazione stock/costo (e decremento su delete) dagli hook alle server actions (`createPurchase`/`deletePurchase` → `applyStockDelta`/`applyPurchaseDeletion` in `src/lib/inventory.ts`). Hook `beforeChange` (calcoli, puro) invariato.
3. **Bug trovato e risolto**: dopo il refactor Fase 3 il pulsante "Elimina prodotto" non esisteva più → riaggiunto in `InventorySection` (Magazzino).
4. **Migration `20260812` validata** su entrambi i percorsi (mai eseguita prima — CI usa `next build`, non `pnpm build`): schema push (ora **idempotente**: vincoli FK in `DO` + backfill condizionato a `linked_product_id`) e schema flat legacy (backfill flat→lines verificato con `scripts/validate-migration-legacy.ts`).
5. **Risultato suite**: **24/24 E2E verdi** sul bundle di produzione. Nota: il `dev server` ha artefatti HMR (remount) assenti in prod; su `/shop` doppio render transitorio (test con `.first()`).

**Verifica Fase 6**: `pnpm lint` ✓ · `pnpm test` 44/44 ✓ · `next build` ✓ · Playwright 24/24 ✓ sul bundle prod.

### Fase 7 — Fix Listino live: `push:false` in produzione + hardening toggle + regressione hydration (2026-08-12)

Sintomo (live `https://darkcardcollection.com/dashboard/listings`): toggle featured/nascondi e modifica valori "non funzionano" (sembra non inviare dati al DB) + `Minified React error #441` in console.

Diagnosi: non riproducibile localmente (dev e prod bundle, dati seed e "live-like": console pulita, toggle ok; scan Playwright della live su tutte le pagine pubbliche e PDP: nessun #441). Cause/correzioni:
1. **`postgresAdapter.push: true` era attivo anche in produzione** → su Vercel ogni cold-start di una serverless faceva la sync schema (introspect+diff), rendendo lente/timeout le server actions della dashboard (sintomo esatto "non riesce a inviare dati al DB"). Fix: `push: process.env.NODE_ENV !== 'production'` (la schema in prod è applicata da `payload migrate` nel build).
2. **Hardening `ListingsSection`**: i toggle ora riconciliano lo stato dalla **risposta della server action** (non solo optimistic update che può essere revertito da un reload/remount) e mostrano toast di esito esplicito.
3. **Regressione**: nuovo `tests-e2e/console-clean.spec.ts` che fallisce se nelle pagine chiave (dashboard + storefront) compare un errore React di hydration (`Minified React error #4..`, `did not match the client`, `A tree hydrated`, ecc.).
4. `hreflang` nel root layout: verificato che NON causa mismatch (escluso empiricamente); lasciata la versione originale minuscola (compatibilità crawler).

Known issue documentati in `AGENTS.md` (Note operative) e `overview.md` (Known Issues 11-12).

**Verifica Fase 7**: `pnpm lint` ✓ · `pnpm test` 44/44 ✓ · `next build` ✓ · Playwright **25/25** ✓ (incl. console-clean) sul bundle prod.

### Fase 8 — Root cause Listino live risolta: schema drift `payload_locked_documents_rels` (2026-08-12)

Con l'accesso autenticato alla live (cookie `dcc-dash` fornito dall'utente) ho riprodotto il problema reale con Playwright (`tests-e2e-live/`): **ogni write della dashboard risponde HTTP 500** (updateProduct toggle, createProduct, updateCategory, deleteCategory); le letture funzionano; su live il toggle non persiste e compare un errore in console.

Dal **log Vercel** (digest fornito dall'utente): `error: column 70cc9076_...purchases_id does not exist` nella query su `payload_locked_documents_rels` (document locking di Payload). La collection `Purchases` è nel config ma la colonna `purchases_id` della tabella join di sistema non era mai stata creata sul DB live (il `push: true` runtime non è mai andato a buon fine sui cold-start serverless) → ogni write fallisce.

**Fix**: migration `20260812_fix_locked_documents_rels.ts` (colonna `purchases_id` + FK `payload_locked_documents_rels_purchases_fk` + indice; idempotente, guardata) applicata alla live via `payload migrate` nel build. Strumenti: `scripts/check-schema-drift.ts` (diff schema vs riferimento) e `scripts/validate-locked-docs.ts` (validazione su fixture). Test live `tests-e2e-live/prod.spec.ts` (cookie da env, mai nel repo).

**Verifica**: locale lint/test/build/E2E 25/25 ✓ · **live**: ri-test autenticato → toggle persiste, create/delete ok, **FAILING_WRITES []**, **CONSOLE_ERRORS []** (sparito anche il #441) ✓ · CI verde · deploy live OK. Lezione documentata in `AGENTS.md` (migration per tabelle di sistema Payload) e `overview.md` (Known Issue #13).

### Fase 9 — Allineamento finale schema live (drift-check con URI fornita, 2026-08-12)

Eseguito `scripts/check-schema-drift.ts` contro la **live** (sola lettura): unico drift residuo = indice `orders.stripe_session_id` (legacy parziale vs Payload pieno). Fix: migration `20260812_align_orders_stripe_session_index.ts` (crea l'indice Payload, droppa il legacy). `check-schema-drift.ts` potenziato per confrontare anche le definizioni degli indici.

**Verifica finale live**: `SCHEMA DRIFT: NESSUNO (allineato al riferimento)` · `tests-e2e-live/prod.spec.ts` + `writes.spec.ts` → tutte le scritture ok (prodotti toggle/create/delete, categorie/collezioni CRUD, messaggi) · **zero 500** · **zero errori console** · CI verde · deploy live OK.
