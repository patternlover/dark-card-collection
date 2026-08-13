# CHANGELOG — Dark Card Collection

Documentazione operativa delle modifiche fatte al progetto. Aggiorna questo file a ogni nuovo intervento.
Ultima sessione: **Fix "Mostra" nel Listino + homepage "In evidenza" guidata dalla stella (4 slot)**.

---

## Sessione recente 20 — Fix "Mostra" prodotto + homepage In evidenza = featured (4 slot)

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-listings-fix-show-featured.md`). Su `main`.

- **Homepage "Prodotti in Evidenza"**: ora filtra `featured: true` (prima mostrava i 4 più recenti, ignorando la stella) con `slice(0, 4)`; **fallback** ai 4 più recenti se nessun gruppo è in evidenza.
- **Listino vista Gruppi**: contatore **"In evidenza n/4"** e **stella disabilitata** quando i 4 slot sono pieni (tooltip "Slot in evidenza pieni (4/4)"). `searchListings` espone `featuredCount`.
- **Hardening toggle visibilità**: `updateGroup`/`toggleVariantVisibility` restituiscono `ok:false` chiaro se 0 documenti aggiornati; dopo ogni toggle riuscito il Listino fa `load()` (stato autoritativo, niente icone stantie).
- **Verifica**: `pnpm lint` ✓ · `pnpm test` 63/63 ✓ · `next build` ✓ · **Playwright su bundle prod 40/40** ✓ (nota: i server E2E vanno lanciati con `--max-old-space-size` per evitare OOM/flakiness).

---

## Sessione recente 19 — Listino a 2 viste (Gruppi / Prodotti) + vendita manuale sul sito

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-listings-two-views.md`). Su `main`.

- **2 viste sulla stessa pagina** con TogglePills (default Gruppi):
  - **Gruppi**: una riga per gruppo, `Prodotto | Qty | Venduti | Disponibilità | Prezzo (sul sito) | Costo medio | Azioni` — senza colonna Stato.
  - **Prodotti** (grafica /inventory): riga per item con Stato, venduti per item, azioni (nascondi singolo, **Vendi**, modifica).
- **Vendita manuale sul sito (non Stripe)**: pulsante "Vendi" per item → modale qty+prezzo → `recordManualWebsiteSale` (canale `website`, pipeline `recordSale` → ordine + stock + FIFO).
- **Search live sul DB senza pulsante "Cerca"** (debounce 300ms, in alto a destra della tabella); filtri compatti per vista.
- **Data layer**: dataset condiviso `fetchListingDataset`; nuova `searchListingProducts` + `flattenListingItems` (in `src/lib/listings.ts`).
- **Verifica**: `pnpm lint` ✓ · `pnpm test` 62/62 ✓ · `next build` ✓ · **Playwright su bundle prod 38/38** ✓.

---

## Sessione recente 18 — Listino: vista iniziale compatta + filtri su 2 righe

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-listings-compact-view.md`). Tutte le modifiche su `main`.

- **Vista iniziale compatta**: le varianti non sono più visibili subito.
  - Gruppo con 1 variante → riga gruppo + riga variante sempre visibili.
  - Gruppo con più varianti → solo la riga gruppo compatta; chevron per espandere/collassare le varianti (stessa tabella, niente sotto-tabella).
  - **Toggle nascondi rapido per singola variante** (occhio) → nuova action strutturata `toggleVariantVisibility` (risultato `{ok,message}`, niente throw → niente #441).
- **Filtri a 2 righe**: riga 1 = Disponibilità + Visibilità affiancati; riga 2 = ricerca + tasto Cerca a destra.
- **Verifica**: `pnpm lint` ✓ · `pnpm test` 60/60 ✓ · `next build` ✓ · **Playwright su bundle prod 37/37** ✓.

---

## Sessione recente 17 — Listino semplificato: filtri ridotti e tabella piatta

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-listings-simplify.md`).

- **Filtri**: rimossi "Canale di vendita" e "In evidenza"; restano ricerca, Disponibilità, Visibilità gruppo, Cerca (tutti su una riga, toolbar `flex-nowrap`).
- **Backend**: `searchListings` non espone più `channels` né i filtri `channel`/`featured` (la lib `filterListingGroups` resta invariata e testata).
- **Tabella piatta**: via il badge "n varianti", via l'espansione e la sotto-tabella annidata. Un solo header `Prodotto | Qty | Venduti | Disponibilità | Prezzo | Costo medio | Stato | Azioni`; riga gruppo (aggregati) seguita dalle righe variante (stato e venduto per item). Prezzo (di vendita) e Costo medio (media storica dal DB) invariati.
- **Test**: E2E aggiornati (varianti piatte, contatore venduti, `.first()` sui locator).

### Verifica
`pnpm lint` ✓ · `pnpm test` 66/66 ✓ · `next build` ✓ · **Playwright su bundle prod 35/35** ✓.

---

## Sessione recente 16 — Rivisitazione modali dashboard (step 1: Vendita Esterna)

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-dashboard-modals-redesign.md`). Branch: `feat/dashboard-modals-redesign`.

### Ordini → "Registra Vendita Esterna"
- Select **Prodotto raggruppato per nome** (`title`) con stock disponibile accanto a ogni voce.
- Lo stesso nome in più varianti DB (grade/condition/language) → voci separate dentro un `<optgroup>`, etichettate con l'attributo discriminante (grade → condition → language).
- Logica pura in `src/lib/sale-options.ts` (`buildSaleOptions`); comportamento invariato: auto-fill prezzo, `max` qty = stock del prodotto selezionato, `recordExternalSale` identico.

### Verifica
`pnpm lint` ✓ · `pnpm test` 66/66 ✓ (6 nuovi in `tests/sale-options.test.ts`) · E2E `orders.spec.ts` 3/3 ✓.

### Prossimi step (branch)
Magazzino → Nuovo/Duplica Prodotto · Listino → Modifica Prodotto · Lotti → Registra/Modifica Lotto · Categorie/Collezioni.

---

---

## Sessione recente 15 — Listino a gruppi per titolo + nomi completi

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-listings-groups-full-names.md`).

### Magazzino
- Nomi completi visibili (rimosso il troncamento a 260px).

### Listino — nuova vista a gruppi per `title`
- Riga **gruppo**: nome completo + badge "n varianti" · **Qty disponibile** · contatore sobrio **×N venduti** · badge **Disponibilità** (In stock / Esaurito-OOS) · Prezzo (minimo) · **Costo medio** (media storica ponderata su tutti i lotti).
- Espansione → righe **variante**: stato (solo per item), disponibilità, prezzo, costo, riepilogo **venduto** (canale + importo) e modifica.
- **Nascondi/Mostra** e **Vetrina** applicati a tutte le varianti del gruppo ("o nascondo tutti o nessuno").
- **Filtri** ridisegnati (Stato rimosso — dettaglio per item): Disponibilità · Canale vendita (dropdown **dinamico** dai valori `orders.sales_channel`) · Visibilità gruppo · Vetrina.
- Data layer: `searchListings` (grouping + summary vendite da ordini pagati, paginazione su gruppi, risultato con `error` invece di throw → niente #441), `updateGroup`, `getProductById`; logica pura in `src/lib/listings.ts`.

### Modello dati (confermato con l'utente)
Products = riga per prodotto/variante visibile; costo/luogo nei Lotti; vendite/piattaforma in Orders. Nessuna migration.

### Verifica
`pnpm lint` ✓ · `pnpm test` 60/60 ✓ · `next build` ✓ · **Playwright su bundle prod 35/35** ✓ (4 nuovi in `listings-groups.spec.ts`, aggiornati i title dei bottoni in `products.spec.ts`).

---

## Sessione recente 14 — Fix delete prodotto live (`Minified React error #441`)

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-fix-delete-product-live.md`). Segnalazione live: su `/dashboard/inventory`, "Elimina prodotto" mostrava `Minified React error #441` (stesso sintomo già visto in sessione 12).

### Root cause (riprodotta su bundle di produzione)
- FK `purchases_lines.product_id` e `orders_items.product_id`: `NOT NULL` + `ON DELETE SET NULL` → il delete di un prodotto referenziato fallisce a DB (`null value in column "product_id"...`).
- In produzione (Next 16), un errore lanciato da una server action arriva al client con messaggio sostituito dal testo minificato `#441` → l'Alert della dashboard mostrava quel testo.
- I test E2E passavano perché eliminavano solo prodotti **senza** riferimenti; i prodotti live con righe lotti/ordini fallivano.

### Fix
- `deleteProduct` → risultato strutturato `{ ok, message }`, **mai throw** (niente 500 → niente #441):
  - prodotto referenziato da ordini → blocco con messaggio chiaro (storico finanziario intoccato);
  - stock residuo nei lotti (`remaining_quantity > 0`) → blocco con messaggio chiaro (guida a Lotti);
  - righe consumate (remaining = 0) → rimosse dal lotto, poi delete;
  - errori imprevisti → messaggio generico pulito.
- `InventorySection.removeProduct` aggiornata per mostrare i messaggi.
- **Regressione**: `tests-e2e/product-delete-guard.spec.ts` (3 scenari: no riferimenti / stock residuo / ordini) — assert "nessun #441".

### Verifica
`pnpm lint` ✓ · `pnpm test` 44/44 ✓ · `next build` ✓ · **Playwright su bundle prod 31/31** ✓ (incl. console-clean senza errori hydration).

### Nota sistemica
Tutte le altre server action che lanciano errori di business (validazioni create/update, vendite esterne...) mostrano lo stesso #441 in produzione — da migrare al pattern risultato-strutturato (task in PENDING).

---

## Sessione recente 13 — Smaltimento task pendenti + centralizzazione

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-align-model.md` §Fase 10). Chiusi tutti i task aperti fuori scope principale.

### Centralizzazione task
- **`docs/project/PENDING.md`**: unico punto per TUTTE le task in sospeso (aperte, waiting-user, non-goal, chiuso storico). Rimossi gli elenchi sparsi da `overview.md` (Known Issues → puntatore), `changelog.md` (Stato attuale → puntatore), `docs/security/changelog.md`; riferimenti aggiornati in `AGENTS.md`, `sessions/README.md`, `schema-and-flows.md`.

### Feature e copertura
- **"Modifica lotto"** (`updatePurchase` in `actions.ts` + UI in `PurchasesSection`): riconciliazione stock via `applyStockDelta`, `remaining_quantity` preservate (FIFO intatto). E2E: edit lotto → stock aggiornato.
- **E2E** per `/dashboard` (overview stats) e `/dashboard/sql` (query read-only) → `tests-e2e/overview-sql.spec.ts`.

### Security REQ
- **REQ-13 access control deny-by-default**: `src/payload/access.ts` (`denyAll`/`allowRead`), `access` esplicito su tutte le collection (write negate; read pubblico solo products/categories/collections), collection `Users` esplicita (register bloccato), `overrideAccess: true` su 99 chiamate interne. Verificato: POST /api/products 403, GET /api/orders 403, register 404, nessun dato creato.
- **REQ-08**: aggiunto `Strict-Transport-Security` (HSTS) in `next.config.ts`.
- **REQ-07**: `src/lib/rate-limit.ts` applicato a `/api/stripe/checkout` (30/min/IP); contact form già limitato.
- **REQ-09**: proxy immagini indurito (redirect in allowlist, content-type `image/*` no svg, limite 5MB).
- **REQ-12**: `src/lib/audit.ts` + eventi (webhook, sale, product.update, order.status, purchase create/update/delete, login/logout dashboard) senza dati sensibili.
- REQ-05/10/14 → coperti/documentati; REQ-15 → `waiting-user` in PENDING.

### Chiusi per design
- Known Issues #1/#2/#3/#4/#5/#6/#7/#9 → non-goal documentati in PENDING; E5/E6 documentati (artefatti dev, assenti in prod).

### Verifica
`pnpm lint` ✓ · `pnpm test` 44/44 ✓ · `next build` ✓ · **Playwright 28/28** ✓ · REST anonima chiusa (403) · HSTS attivo.

---

## Sessione recente 12 — Fix schema drift live: `payload_locked_documents_rels.purchases_id` mancante

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-align-model.md` §Fase 8). Con accesso autenticato alla live (cookie fornito) ho riprodotto il problema reale: **ogni write della dashboard (updateProduct, createProduct, updateCategory, deleteCategory) rispondeva HTTP 500** mentre le letture funzionavano.

### Root cause (dal log Vercel)
`column ...purchases_id does not exist` in `payload_locked_documents_rels` (tabella di sistema Payload per il document locking): la collection `Purchases` era nel config ma la colonna `<collection>_id` nel join table non è mai stata aggiunta al DB live (il push runtime non è mai andato a buon fine sui cold-start serverless). Ogni write Payload esegue una SELECT di lock su quella tabella → 500.

### Fix
- **Migration `20260812_fix_locked_documents_rels.ts`**: aggiunge `payload_locked_documents_rels.purchases_id` + FK `payload_locked_documents_rels_purchases_fk` (→ `purchases(id)` ON DELETE CASCADE) + indice. Idempotente, applicata alla live dal `payload migrate` nel build del deploy.
- **`scripts/check-schema-drift.ts`**: confronta schema DB target vs riferimento (tabelle/colonne/FK/indici) per intercettare questa classe di drift.
- **`scripts/validate-locked-docs.ts`**: validazione della migration su fixture (stato rotto → fix, idempotenza, down).
- **`tests-e2e-live/prod.spec.ts`**: test live autenticato (cookie da env `DASH_COOKIE`) — toggle/featured/edit/create/delete con assert "nessun 500" e "nessun errore hydration".

### Verifica
- Localmente: lint ✓ · test 44/44 ✓ · build ✓ · E2E 25/25 ✓.
- **Live**: dopo il deploy, ri-test autenticato → `TOGGLE_PERSISTED` · `CREATE_OK` · `DELETE_OK` · **FAILING_WRITES []** · **CONSOLE_ERRORS []** (il #441 è sparito insieme ai 500).
- CI verde · deploy live OK.
- Lezione documentata in `AGENTS.md` (Note operative: migration per le tabelle di sistema Payload, verifica drift) e `overview.md` (Known Issue #13).

### Allineamento indice `orders.stripe_session_id` (follow-up, 2026-08-12)
Il drift-check contro la **live** (URI fornita dall'utente, sola lettura) ha rilevato un'unica differenza residua: la live aveva l'indice legacy della migration (`orders_stripe_session_id_unique`, UNIQUE parziale) invece di quello generato da Payload (`orders_stripe_session_id_idx`, UNIQUE pieno). Funzionalmente equivalenti (dedup webhook), ma per l'allineamento esatto al teorico: migration `20260812_align_orders_stripe_session_index.ts` (crea l'indice Payload, poi droppa il legacy — nessuna finestra senza vincolo). `check-schema-drift.ts` ora confronta anche le definizioni degli indici.

**Verifica finale live**: `SCHEMA DRIFT: NESSUNO (allineato al riferimento)` · test live `prod.spec` + `writes.spec` → **tutte le scritture ok, zero 500, zero errori console** · CI verde · deploy OK.

---

## Sessione recente 11 — Fix Listino live: `push:false` in prod + hardening + regressione #441

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-align-model.md` §Fase 7). Segnalazione live: su `/dashboard/listings` i toggle (featured/nascondi) e le modifiche non aggiornavano ("non riesce a inviare dati al DB") con `Minified React error #441` in console.

### Diagnosi
- Non riproducibile localmente (dev e prod bundle, dati seed e "live-like": console pulita, toggle funzionanti; scan Playwright della live su pagine pubbliche e PDP: nessun #441).
- Causa principale: **`postgresAdapter.push: true` anche in produzione** → su Vercel ogni cold-start serverless eseguiva la sync schema (drizzle introspect+push) rendendo lente/timeout le server actions della dashboard.

### Fix
1. **`src/payload.config.ts`**: `push: process.env.NODE_ENV !== 'production'` — in prod la schema è applicata da `payload migrate` nel build; niente più sync a ogni cold-start.
2. **`ListingsSection`**: toggle (visibilità/featured) riconciliano lo stato dalla **risposta della server action** (stato autoritativo, niente optimistic-revert) + toast di esito esplicito.
3. **Regressione**: `tests-e2e/console-clean.spec.ts` — fallisce se pagine chiave (dashboard + storefront) mostrano errori React di hydration.
4. `hreflang` del root layout: escluso empiricamente come causa del #441 (lasciato invariato).

### Verifica
`pnpm lint` ✓ · `pnpm test` 44/44 ✓ · `next build` ✓ · **Playwright 25/25** ✓ (incl. console-clean) sul bundle prod. Known issue documentati in `AGENTS.md` e `overview.md` (#11 push:false, #12 #441 mitigato).

---

## Sessione recente 10 — Bugtesting E2E dashboard + fix bug + validazione migration

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-align-model.md` §Fase 6, tracker `docs/project/PENDING.md`). Suite end-to-end Playwright della dashboard in locale, con fix di bug trovati.

### Ambiente
- Postgres locale (`dcc_test`), `.env.test` (gitignored), seed `scripts/test-db-setup.ts`, `@playwright/test`, `playwright.config.ts` con auth bypass (cookie `dcc-dash` firmato). Suite `tests-e2e/` **24 test**.

### Bug trovati e risolti
- **Critico — deadlock creazione lotto**: l'hook `afterChange` di `Purchases` faceva `payload.update` su `products` in transazione → si bloccava. Spostata l'applicazione stock/costo/decremento dagli hook alle server actions (`applyStockDelta`/`applyPurchaseDeletion` in `src/lib/inventory.ts`, usate da `createPurchase`/`deletePurchase`).
- **"Elimina prodotto" assente** dopo il refactor Fase 3 → riaggiunto in `InventorySection` (Magazzino).

### Migration `20260812` validata (mai eseguita prima: CI usa `next build`, non `pnpm build`)
- Ora **idempotente** (vincoli FK in `DO` + backfill condizionato a `linked_product_id`).
- Validata su entrambi i percorsi con `scripts/validate-migration-*.ts`: schema push e schema flat legacy (backfill flat→lines verificato).

### Risultato
- `pnpm lint` ✓ · `pnpm test` 44/44 ✓ · `next build` ✓ · **Playwright 24/24 verdi** sul bundle prod · push + CI verde + deploy live OK (commit `c5da77f`).
- Note: artefatti HMR solo nel dev server (assenti in prod); doppio render transitorio su `/shop` in caricamento (test con `.first()`); **gap**: manca la modifica di un lotto in `/dashboard/purchases` (feature request).

---

## Sessione recente 9 — Allineamento al modello inventario (Fasi 1-5)

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-12-align-model.md` + tracker `docs/project/PENDING.md`). Implementato il modello target di AGENTS.md/overview.md: Purchases a righe con FIFO e costi effettivi, pipeline vendita condivisa, dashboard Lotti/Magazzino/Listino/Ordini/Messaggi, storefront "Esaurito".

### Modello dati (Fase 1)
- `Purchases` riscritta: `purchase_date`/`source_type`/`source_name`/`extra_costs`/`notes`/`lines[]` (`product`, `quantity`, `unit_cost`, `effective_unit_cost`, `remaining_quantity`)/`total_cost`. Hook `beforeChange` (costi, init residui), `afterChange` (stock + costo medio), `afterDelete` (decremento residuo).
- `Orders`: +`sales_channel` (website/vinted/ebay/cardmarket/other), +`unit_cost_snapshot` in items.
- `Products`: `cost_of_goods_sold` readOnly (derivato); hook `beforeChange` auto `sold`/`out_of_stock` a stock 0 e `listed`/`in_stock` al restock.
- Nuovi `src/lib/purchase-math.ts`, `src/lib/inventory.ts`; migration `20260812_purchases_lines_schema.ts` (schema + backfill flat→lines); `payload generate:types`.

### Pipeline vendita (Fase 2)
- `src/lib/record-sale.ts`: `allocateFifo` + snapshot costo + stock + consumo `remaining_quantity`. Webhook Stripe → `recordSale`; **fix FK** riga spedizione (`product: 0`) ora nel campo `shipping`; `recordExternalSale` → `recordSale` (**fix out-of-schema**: email, status `paid`, items puliti); piattaforme esterne `vinted|ebay|cardmarket|other`.

### Dashboard (Fase 3)
- Rotte: `purchases`/`inventory`/`listings`/`orders`/`messages` (rename da acquisti/prodotti/ordini/messaggi). `PurchasesSection` (lotto header + righe), `InventorySection` (stock/costo medio/storico), `ListingsSection` (price/status/is_visible/featured), `OrdersSection` (canale, margine, vendita esterna). `actions.ts` riscritto su nuovo modello.

### Storefront (Fase 4)
- Filtri → `status in [listed, hold, sold] AND is_visible` ovunque (shop, PDP, related, bestsellers, sitemap, llms-full, FeaturedProducts). "Esaurito": badge ProductCard, PDP non più `notFound`, ATC/QuickAdd/Sticky disabilitati a stock 0.

### Test / infra / cleanup (Fase 5)
- **Fix test-infra**: polyfill `localStorage`/`sessionStorage` (`tests/setup.ts`) — risolti i 9 test rossi pre-esistenti (root cause: getter sperimentale Node 26 che torna `undefined`).
- Nuovi test `purchase-math` (7) + `record-sale` (9) + sold/stock-0 (2). **`pnpm test` 44/44 ✅**.
- Rimosso codice morto: `ProductsSection`, `ProductTable`, `ProductGroupRow`, `ExternalSaleModal`.
- Docs aggiornati: `overview.md`, `schema-and-flows.md`, sessioni, tracker PENDING.

**Verifica**: `pnpm lint` ✅ · `pnpm test` 44/44 ✅ · **push + CI + deploy** (commit `c8a5981`): CI verde su Postgres (migration applicata), auto-deploy Vercel verificato sulla live (nuove rotte `/dashboard/purchases` e `/dashboard/listings` rispondono 200).

---

## Sessione recente 8 — Modulo Acquisti (Purchases) e Vendite Esterne

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-10-purchases-and-external-sales.md`). Implementato il modulo completo degli acquisti (fornitori/edicole/supermercati) con carico automatico in inventario/catalogo, e la gestione delle vendite esterne (Vinted, Wallapop, eBay, Subito, Altro) con tracciamento della piattaforma, prezzo e quantità.

### Nuove funzionalità
- **Collection `Purchases`**: Tabella/collection Payload CMS per tracciare gli acquisti (costo di acquisto, quantità, negozio, data, note).
- **Dashboard `/dashboard/acquisti`**: Sezione dedicata per visualizzare, cercare e registrare nuovi acquisti, con creazione automatica del prodotto in inventario (`Products`).
- **Vendite Esterne**: Pulsante e modale `ExternalSaleModal` in `/dashboard/prodotti` (vista tabella e card) per registrare vendite su piattaforme esterne, scalare lo stock e registrare la transazione negli ordini (`Orders`).

**Verifica**: `pnpm test` (26/26 test) ✅.

---

## Sessione recente 7 — Performance + sicurezza dashboard · messaggi paginati

Sessione OpenCode (dettagli: `docs/project/sessions/2026-08-10-dashboard-perf-sec.md`). Dashboard più reattiva, chiusi i buchi di sicurezza dalla review (sezione SQL, form contatti), inbox messaggi paginato, introdotto lo storico sessioni.

### Performance
- **File**: `src/app/dashboard/actions.ts`, `src/lib/db-query.ts`
- `actions.ts` usa il client Payload in cache (`@/lib/payload`) invece di ricrearlo a ogni chiamata.
- `getOverview`: aggregazioni SQL (`COUNT`/`SUM FILTER`) al posto di scaricare 1000+1000 documenti; solo 8 ordini recenti via Payload; fallback al vecchio percorso se le query falliscono.
- `getDbOverview`: una singola query (era N+1 su ogni tabella).
- Aggiornamenti ottimistici: toggle visibilità, edit variante (`EditProductModal` restituisce il DTO salvato), delete gruppo/variante, create/edit/delete categorie e collezioni. Refetch solo su errore.

### Sicurezza
- `runReadOnlyQuery`: transazione **read-only** (`BEGIN READ ONLY`) + `statement_timeout = 10s` + `ROLLBACK` in `finally`.
- Sezione SQL dietro flag `ENABLE_DASH_SQL` (default: on in dev, off in prod). Nav nascosta quando off, `sql/page.tsx` mostra messaggio. `.env.example` aggiornato.
- `/api/contact`: honeypot `website` (falso successo), rate limit 3/ora per IP, max lunghezza campi. `ContactForm` invia l'honeypot.

### Messaggi
- `getMessages` → `getMessagesPage` (paginato, 20/pagina, senza corpo) + `getMessageBody` caricato lazy all'espansione; toggle read/replied ottimistici con revert.

### Altro
- Rimosso `src/app/dashboard/main.tsx` (legacy non importato).
- Storico sessioni OpenCode introdotto (`docs/project/sessions/README.md`) + regola in `AGENTS.md`.

**Verifica**: `pnpm lint` ✅ · `pnpm test` 26/26 ✅ · build + deploy Vercel.

---

## Sessione recente 6 — Allineamento schema Google Merchant/GA4

Rinominazione dei campi Products/Orders ai nomi Google Merchant Center e GA4, con migration manuale, script di backfill/dedup e refactor completo del frontend.

### Schema Payload (collections Products + Orders)
- **File**: `src/payload/collections/Products/index.ts`, `src/payload/collections/Orders/index.ts`, `src/payload-types.ts`
- Renames Products: `store_price→price` (prezzo vendita), `price→cost_of_goods_sold` (costo), `compare_at_price→sale_price` (prezzo barrato), `image_url→image_link`, `condition→grade` (grado TCG, enum rinominato `enum_products_condition→enum_products_grade`).
- Drop: `item_id`, `product_state`.
- Nuovi Products: `item_group_id`, `product_type`, `google_product_category`, `availability` (enum `in_stock/out_of_stock/preorder/backorder`, default `in_stock`), `condition` Google (enum `new/refurbished/used`, default `used`).
- Renames Orders: `order_id→transaction_id`, `total→value`; nuovi: `currency` (default EUR), `shipping`, `tax`.

### Migration + backfill
- **File**: `src/migrations/20260809_google_schema.ts`, `src/migrations/index.ts`, `scripts/backfill-google-schema.ts`, `package.json`
- Migration manuale: rename colonne/type enum, drop `item_id`/`product_state`, new enums, backfill `availability` (preorder se `is_preorder`, `out_of_stock` se status sold o quantity ≤ 0), orders `currency='EUR'`, `shipping=0`, `tax=0`. Down completo.
- Script post-deploy `pnpm backfill:google-schema`: backfill `item_group_id` da slugify(title) + dedup per `title|language|grade` (survivor = maggior qty, pareggio updated_at più recente; somma quantità, merge immagini, delete altre righe).

### Refactor frontend
- **File**: `src/lib/{group-products,product-image}.ts`, `src/components/product/*`, `src/app/products/[slug]/page.tsx`, `src/components/sections/FeaturedProducts.tsx`, `src/app/api/stripe/*`, `src/app/checkout/success/page.tsx`, `src/app/llms-full.txt/route.ts`, shop pages.
- Shop, PDP, cart e checkout usano `price`, `image_link`, `grade` (label TCG), `is_preorder`, `is_visible`, `item_group_id` (sku PDP); webhook crea order con `transaction_id`/`value`/`currency`/`shipping`; `/api/stripe/order` query per `stripe_session_id`.
- Filtro shop rinominato `condition→grade` (URL `?grade=`), import `CONDITION_OPTIONS→GRADE_OPTIONS` (`src/lib/product-filters.ts`, `src/components/sections/ClientListing.tsx`).

### Dashboard
- **File**: `src/app/dashboard/actions.ts`, `src/app/dashboard/main.tsx`, `src/components/dashboard/{CreateProductModal,EditProductModal,ProductGroupRow}.tsx`
- DTO e query aggiornati (price, sale_price, cost_of_goods_sold, availability, grade, condition Google, product_type, google_product_category, image_link, average_sale_price, last_price_update, transaction_id/value); `PATCH_FIELD_MAP` camelCase→snake_case; create/edit product con i nuovi campi.

### Test + note operative
- **File**: `tests/{group-products,cart,sticky-add-to-cart,product-filters}.test.ts`
- 26/26 test verdi; `pnpm lint` (tsc) pulito.
- La migration si applica al deploy (build esegue `payload migrate`); dopo il deploy lanciare `pnpm backfill:google-schema`.

---

## Sessione recente 5 — Dashboard prodotti + rimozione legacy Google Sheets · commit `f30618e` → `4333c9d`

Interventi dal `f30618e` in poi: gestione prodotti unificata in `/dashboard`, rimozione totale del flusso Google Sheets e di `/admin/products`.

### Dashboard — tab Prodotti raggruppati per varianti
- **File**: `src/app/dashboard/main.tsx`, `src/app/dashboard/actions.ts`, `src/components/dashboard/{ProductGroupRow,EditProductModal,CreateProductModal}.tsx`, `src/lib/slug.ts`
- `ProductGroupRow` espandibile: thumb, badge stato/condizione/lingua, prezzo "da", qty totale, toggle visibilità gruppo (eye), delete gruppo/variante, edit parent/varianti.
- `EditProductModal` con tutti i campi (title, slug, itemId, descrizione, prezzi, stato, condizione, lingua, categoria, collezione, quantità, cardNumber, rarità, imageUrl, featured, isVisible).
- `CreateProductModal` → nuovo prodotto da tab Prodotti (bottone "Nuovo Prodotto"); slug auto-generato con dedup (`src/lib/slug.ts`).
- `actions.ts`: `searchProducts` con filtri (search/status/category/collection/withImage), `getCategories`/`getCollections`, `createProduct`, `updateProduct` full-field, `OrderDTO` con items + `stripeSessionId`.

### PLP — ProductCard canonica
- **File**: `src/components/product/ProductCard.tsx`, `ProductGroupCard.tsx` (eliminato)
- `ProductCard` ora riceve `group: ProductGroup` (badge preordine/sigillato/graded, collezione, prezzo di gruppo, qty disponibili, QuickAdd con `maxQuantity`).
- Applicata a shop, bestseller, new-arrivals, preorders, categorie, collezioni, related PDP, FeaturedProducts; rimosso il prop `grouped` da `ListingShell`/`ClientListing`.

### Rimozione legacy Google Sheets (solo database)
- **Eliminati**: `/admin/products` (page + `api/admin/products` + `api/admin/backfill-images`), `/api/cron/import`, `/api/cron/prices`, `/api/products/import`, `src/components/admin/*`, `src/lib/{google-sheets,image-import,parse-csv,api-auth}.ts`, `scripts/import-products.ts`, `tests/parse-csv.test.ts`.
- **Env rimosse da `.env.example`**: `CRON_SECRET`, `SYNC_PASSWORD`, `GOOGLE_SERVICE_ACCOUNT`, `GOOGLE_SHEET_ID`.
- **vercel.json**: rimossi i crons `/api/cron/import` (3am) e `/api/cron/prices` (4am).
- **package.json**: rimosso script `import-products`. `googleapis` resta in deps (usato da OAuth Google callback).
- Nota operativa: rimuovere anche l'eventuale cron `/api/cron/import` e `/api/cron/prices` dal dashboard Vercel (non più presenti in `vercel.json`).
- Documentazione aggiornata: `README.md`, `AGENTS.md`, `docs/project/overview.md`, `docs/database/schema-and-flows.md`, `docs/security/{architecture,secrets-management}.md`.

---

## Sessione recente 4 — PLP/checkout/hero + SEO + hardening · commit `07cfe77` → `4f4e227`

Interventi dal `07cfe77` in poi: layout filtri PLP, breadcrumb, checkout embedded, hero scroll,
SEO `/llms-full.txt`, hardening sicurezza, pulizia deps, config orchestrator.

### PLP — layout filtri secondo spec + breadcrumb
- **File**: `src/app/shop/page.tsx`, `src/components/sections/{ListingShell,ClientListing}.tsx`, `src/components/ui/Breadcrumb.tsx`
- Griglia 2x2 desktop (Row1: breadcrumb+titolo+search; Row2: filtri+listato), mobile: path/titolo/desc → searchbar → dropdown filtri → listato.
- Componente `Breadcrumb` riutilizzabile con path attivo sottolineato, applicato a tutte le pagine (shop, PDP, cart, checkout, success, privacy, terms, shipping-returns).
- Skeleton PLP per caricamento uniforme; listato a masonry; card filtri allineate con la prima card; gap filtri/listato (`lg:gap-8`); distanza filtri/navbar (`lg:mt-16 aside`, listato `lg:pt-16`).
- `ProductFilters.tsx`/`ProductGallery.tsx` rimossi (morti, sostituiti dai nuovi componenti).

### Hero LP — movimento scroll fluido
- **File**: `src/components/sections/HeroBackground.tsx`
- Niente scale/rotate sul layer (solo parallax translateY), glow non ruotati, rotazione oggetti su se stessi guidata dallo scroll (desktop+mobile). Rispetta `prefers-reduced-motion`.

### Checkout — branding dark/yellow embedded
- **File**: `src/app/checkout/page.tsx`, `src/lib/stripe.ts`
- Rimosso `appearance` embedded (fix `initEmbeddedCheckout`), contenitore neobrutal, gerarchia z-index (navbar>cookie banner), confetti spark da mobile.

### Dashboard + nav
- Rimossa tab "Sincronizzazione" da `/dashboard` (sync solo via cron).
- Sottolineatura voce di menu attiva (current path) in `Header` e `MobileMenu`.

### Security + deps
- Hardening checkout/order/webhook/auth (`b6aaa0a`): prezzo server-side, protezione `/api/stripe/order`, idempotenza webhook + stock.
- Upgrade: next 16.3, payload 3.87.1, sharp 0.35.3.
- `pnpm audit` pulito: dompurify 3.4.13, esbuild 0.25, undici 6.28, postcss 8.5.26, override nanoid 3.3.17 (GHSA-2v37-7h3g-55p8).

### SEO
- **File**: `src/app/llms-full.txt/route.ts`, `src/app/llms.txt/route.ts`
- Aggiunto `/llms-full.txt` con catalogo dinamico; aggiornato `llms.txt`.

### Infra AI + docs
- Config orchestrator lean (`4f4e227`): `.opencode/oh-my-opencode-slim.json` + `orchestrator_append.md` (budget richieste).
- Riorganizzazione documentazione (`f818ce1`): file root obsoleti migrati in `docs/` kebab-case + `AGENTS.md`.
- Cleanup codice (`1599feb`): export non usati resi privati, componenti morti rimossi, deps superflue eliminate.

---

## Sessione recente 3 — UX/UI (7 task) · commit `07cfe77`

Tutti e 7 i punti implementati, test 24/24, build ok, deployato e verificato in produzione.

### 1. Barra di caricamento fluida
- **File**: `src/components/ui/RouteProgress.tsx`
- Riscritta da `setInterval` + `transition` (a scatti) a un loop `requestAnimationFrame` con easing continuo.
- Comportamento: entra a ~0%, crawl lento verso 95% mentre carica, poi completamento morbido a 100% e fade-out.
- Trigger: patch di `history.pushState` / `history.replaceState` + `popstate`; completamento quando cambia `pathname`/`searchParams`.
- Montata nel Root Layout dentro `<Suspense fallback={null}>` (requisito per `useSearchParams`, evita il CSR bailout su `/guide` e `/404`).

### 2. LP — oggetti hero in movimento con lo scroll
- **File**: `src/components/sections/HeroBackground.tsx`
- Ogni elemento decorativo (quadrati, punti, `+`, bagliori) ora ha attributi `data-x`, `data-y`, `data-phase`:
  - parallasse in funzione dello scroll con profondità diverse per elemento (strati a velocità differenti),
  - floating/rotazione "su se stessi" calcolati in JS (`sin`/`cos` nel tempo),
  - rotazione complessiva e zoom del contenitore legati allo scroll.
- Rimossi `rotate-12`/`rotate-45` statici e l'animazione CSS `hero-bob` (ora gestita in JS).
- Rispetta `prefers-reduced-motion` (nessun movimento).

### 3. PLP — più distanza tra tab filtri e navbar
- **File**: `src/components/sections/ListingShell.tsx`
- Padding del contenitore: `py-8` → `pt-12 pb-10` (mobile) / `pt-16` (desktop).

### 4. PLP — animazione pop ATC cyberpunk
- **File**: `src/app/globals.css` (`@keyframes atc-pop`)
- Nuova animazione `0.5s cubic-bezier(0.22,1,0.36,1)`: scale 1.22 + rotazione −7°, neon glow accent (`color-mix(var(--accent))`), flash `brightness`, rimbalzo e ritorno.
- Colore sempre `var(--accent)`. Applicata a `QuickAddButton` (PLP) e `AddToCartButton` (PDP).

### 5. PLP — altezza contenitore filtri stabile
- **File**: `src/components/sections/ClientListing.tsx`
- Il bottone mobile "Azzera filtri" ora è SEMPRE renderizzato: quando nessun filtro è attivo usa `invisible` (riserva lo spazio) invece di sparire. Nessun salto di altezza della card quando applichi/rimuovi un filtro.

### 6. PLP — cursore mano sull'ATC
- **File**: `QuickAddButton.tsx`, `AddToCartButton.tsx`
- Aggiunto `cursor-pointer` (il bottone `disabled:cursor-not-allowed` resta prioritaro quando disabilitato).

### 7. Coerenza larghezza pagine info
- **File**: `src/app/info/{about,faq,privacy,shipping-returns,terms}/page.tsx`
- Tutte portate da `max-w-3xl` a `max-w-2xl`, uguale a `/info/contact`. Verificato live su `/info/faq` e `/info/about`.

---

## Sessione recente 2 — Fix Stripe live + Google OAuth · commit `2378918`

### Stripe — fix "Failed to load Stripe.js" (root cause trovata)
- **Causa**: la Content-Security-Policy di `next.config.ts` aveva `script-src 'self' 'unsafe-inline' 'unsafe-eval'` senza `https://js.stripe.com` → il browser bloccava lo script Stripe → esattamente l'errore visto.
- **Fix**: aggiunto `https://js.stripe.com` a `script-src`. Verificato in produzione con l'header CSP live.
- **Modalità**: il bundle client ora inlina `pk_live_...` (Stripe **live**); `STRIPE_SECRET_KEY` e webhook devono essere `sk_live_...` / `whsec_live_...` (confermato dal proprietario su Vercel).
- Stripe check: pagina checkout → `loadStripe` → `createEmbeddedCheckoutPage` con `client_secret` restituito da `/api/stripe/checkout`.

### Google OAuth — cookie impostati direttamente sulla response
- **File**: `src/app/api/auth/google/route.ts`, `src/app/api/auth/google/callback/route.ts`, `src/lib/dash-auth.ts`
- I cookie `dcc-oauth-state` e di sessione `dcc-dash` ora vengono impostati con `res.cookies.set(...)` direttamente sulla `NextResponse`, invece che via cookies-store + redirect (quirk noto di Next.js che poteva far perdere il cookie).
- Verificato live: la route `/api/auth/google` emette `Set-Cookie: dcc-oauth-state=...; SameSite=lax; Secure; HttpOnly`.
- Flusso: `/dashboard` → "Accedi con Google" → `/api/auth/google` (state nonce) → accounts.google.com → callback (code exchange, verify ID token, whitelist `DASHBOARD_GOOGLE_EMAILS`) → cookie sessione → `/dashboard`.
- OAuth app pubblicata ("In produzione") dal proprietario; variabili su Vercel OK.

---

## Sessione recente 1 — 18 task QA · commit `f57d54c`

1. **Google login** — dashboard protetta con OAuth Google (vedi sessione 2 per lo stato).
2. **LP**: rimosse sezioni "Spedizione gratuita dagli 80€" (banda) e "Domande Frequenti" dalla home (`PromoBand.tsx`, `HomepageFaq.tsx` eliminati).
3. **Banner spedizione gratis 80€**: fisso SOPRA la navbar su TUTTE le pagine (`LayoutShell` + `--banner-h` + header sticky offset).
4. (Caricamento) — completato nella sessione 3.
5. **PLP**: titolo/sottotitolo spostati nella colonna listato sopra la griglia (`ClientListing`), fuori dalla colonna filtri.
6. **Sticky ATC**: si solleva quando il footer è visibile (`StickyAddToCart` + IntersectionObserver), non copre più fascia privacy/termini/spedizione.
7. **PDP prodotti correlati**: lingua "IT" ora visibile, non coperta dal QuickAdd (`ProductCard` pr-14).
8. **Mobile PDP**: breadcrumb + badge sopra l'immagine (`lg:hidden`/`hidden lg:block`).
9. **LP hero**: movimento scroll-based al posto del mouse (esteso nella sessione 3).
10. **Ricerca**: deduplicazione per titolo — 1 card per prodotto (la quantità resta per ATC/PDP).
11. **/guide**: card articoli altezza uguale (`h-full`).
12. **Banner 80€ su ogni pagina** (vedi punto 3).
13. **Checkout**: hover riga riepilogo con colore accent.
14. **Checkout**: `cursor-pointer` su +/−/cestino.
15. **Carrello**: merge per `id` prodotto (quantità sommate, non righe duplicate) + test.
16. **Stripe env**: aggiunta `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (poi completata con fix CSP sessione 2).
17. **Struttura PDP/PLP**: popolamento automatico senza errori con prodotti dal DB (validato).
18. **Animazioni/titoli**: Reveal unificato su cart/checkout/success/ListingShell; titoli info unificati (completato sessione 3).

---

## Stato attuale (su cui riprendere)

> ⚠️ La tabella sotto è **storica** (sessione 2-8). L'unico punto aggiornato per le task in sospeso è **[`docs/project/PENDING.md`](./PENDING.md)**.

| Area | Stato (storico) |
|------|-------|
| Stripe | CSP fixata e live; API/webhook verificati (Fase E); pagamento reale → `PENDING.md` W3 |
| Google dashboard | Verificato (cookie live + test E2E) — chiuso |
| Dashboard | Lotti/Magazzino/Listino/Ordini/Messaggi attivi; edit lotto → `PENDING.md` A3 |
| Google Sheets | Rimosso (import/cron/admin) — chiuso |
| PLP / Hero / Checkout / Filtri / ATC / Info / SEO | Attivi (verificati in E2E) |
| Security | Hardening base applicato; REQ rimanenti → `PENDING.md` D1-D8 |

---

## Comandi utili

```bash
pnpm test                                   # test Vitest (24/24)
NODE_OPTIONS="--max-old-space-size=4096" pnpm build   # build locale (workaround heap WSL)
npx vercel env ls production               # elenco variabili (timestamps = creazione, non modifica)
npx vercel env pull /tmp/env.prod --environment=production --yes   # valori (mascherati [SENSITIVE] se criptati)
npx vercel --prod                          # deploy
```

## Note operative

- Vercel ora maschera i valori criptati in `env pull` (`[SENSITIVE]`): per verificare il prefisso `pk_/sk_/whsec_` usare il Dashboard Vercel o un endpoint di test.
- Modificare una `NEXT_PUBLIC_*` su Vercel richiede un **redeploy** per essere inlinata nel bundle.
- `script-src` CSP include `https://js.stripe.com` — non rimuoverlo, altrimenti il checkout si rompe di nuovo.
- I cookie OAuth vanno impostati con `res.cookies.set()` (non cookies-store) per evitare che si perdano col redirect.
