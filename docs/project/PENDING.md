# PENDING — Unico punto per TUTTE le task in sospeso

> Questo file è **l'unico punto** in cui vivono le task in sospeso del progetto.
> Non esistono più elenchi sparsi (overview, changelog, docs/security, sessioni):
> tutto punta qui. Ogni sessione inizia leggendo questo file e termina aggiornandolo.
>
> Stati: `open` · `in-progress` · `blocked (motivo)` · `waiting-user` (serve input utente) · `done (verifica)`.
> Un task si chiude SOLO con verifica fatta (`pnpm lint`, `pnpm test`, build/E2E/CI dove applicabile).

Ultimo aggiornamento: 2026-08-29 (sessione 41: **Replatform Medusa F3 code-prep** — Dockerfile, railway.json, env prod, feed Google Merchant `/api/feed/products`, doc passi deploy/cutover; sessione 40: **Replatform Medusa F2** — storefront completo su Medusa (catalogo, cart, checkout, account cliente); sessione 39: **Replatform Medusa F1** — modulo `procurement` custom; sessione 38: **Replatform Medusa F0** — scaffold backend Medusa v2 in `apps/backend`, branch `feat/medusa-replatform`; precedente 2026-08-16 sessione 37: fix batch 2 — Scontrino/Note verticali, env Drive JSON, rimozione ridondanze, label condivise, test DB integrazione + restyle CMS pulito; sessione 36: fix upload scontrino client_email da JSON, scontrino/note stessa altezza, wording magazzino, tema dashboard luminous neon — commit task + commit grafico; sessione 35: fix upload Drive chiave/limite, riga lotto verticale + optgroup, ricerca lotti, modale edit senza lingua, storico magazzino slim; sessione 34: fix batch — upload Drive PDF, immagini Blob via script, vendita unificata con username, Listati solo Gruppi, via image_link, data GG/MM/AAAA, search Enter; sessione 33: modale lotto slim + scontrino Google Drive, categorie per tipo `kind`, via rarità, fix stock/residuo + reconcile live; sessione 32: B2 server action senza throw + lingua comune; sessione 31: fix dashboard — nav highlight listati/impostazioni, colonne listati/lotti/inventario, hint slug, niente valori legacy; sessione 30: lotti Nuovo prodotto/Nuova carta + espansioni multiple + date GG/MM/AAAA; sessione 29: categorie dinamiche + semplificazione stato + slug inglesi + tabelle uniformi; sessione 28: remap item_category Macro/Espansione/Micro + via categories + Listati; sessione 27: item_category_1/2/3 + tipo articolo nel lotto + restyle modali; sessione 26: item_category + rename Espansioni; sessione 25: Lotti dropdown per gruppo prodotto + select Variante, branch fix/ui-ux; sessione 24: dashboard più larga 1440px; sessione 23: merge rivisitazione modali dashboard in main + E2E su bundle prod 47/47; sessione 22: Listino righe allineate nome una riga; sessione 21: Listino tabella /inventory + sorting header + email cliente; sessione 20: fix Mostra + homepage featured; sessione 19: Listino 2 viste; sessione 18: vista compatta; sessione 17: filtri ridotti; sessione 16: modali dashboard; sessione 15: Listino a gruppi; sessione 14: fix delete prodotto live).

---

## 1. Aperti (da fare)

| # | Task | Stato |
|---|------|-------|
| B1 (#22) | **Data-cleanup legacy**: DECISIONE UTENTE 2026-08-12 — l'utente eliminerà tutti i prodotti e li reinserirà col flusso normale (niente merge script). ⚠️ Ordine sicuro di delete: prima `purchases` (lotti) e `orders` che referenziano i prodotti, poi i prodotti (vincolo FK `orders_items.product_id`/`purchases_lines.product_id` NOT NULL). Da verificare dopo l'operazione: grouping, PDP, sitemap, drift-check | waiting-user (operazione manuale utente) |
| B2 | **Server actions: niente throw** — Next 16 in produzione sostituisce il messaggio degli errori lanciati dalle server action col testo minificato `Minified React error #441` (verificato). ✅ Migrate al pattern risultato-strutturato (`{ ok, message }`): `createProduct`, `updateProduct`, `createPurchase`, `updatePurchase`, `updateOrderStatus`, `createCategory`, `updateCategory`, `createEspansione`, `updateEspansione`, `recordExternalSale` + `deleteProduct`/`deleteOrder`/`deletePurchase`/`deleteCategory`/`deleteEspansione` (sessione 2026-08-24) + auth strutturato (`authError`) nelle write; consumer aggiornati. `requireAuth()` resta per le read-only (protezione layout) | done (verifica: lint ✓ · test 100/100 ✓) |
| B3 | **Divergenza stock vs residuo** (es. "Collezione Illustrazione Serie 2" stock 0 con residuo 2): ✅ root cause = righe legacy con `remaining_quantity` NULL (FIFO non consumava ma stock sì); fallback uniforme `?? line.quantity` in `record-sale.ts`, backfill NULL→quantity nella migration `20260815_lot_receipt_category_kind_drop_rarity`, script `scripts/reconcile-stock.ts` (products.quantity = Σ remaining) eseguito sul live — prodotto 44: stock 0 → 2, `in_stock` | done (verifica: reconcile dry-run + eseguito ✓) |
| R1 | **Replatform Medusa — F1**: modulo custom `procurement` (lotti, FIFO `effective_unit_cost`, costo medio, margini, sales channel esterni) + Admin routes/widgets + porting test `purchase-math`/`record-sale`/`inventory` (branch `feat/medusa-replatform`) | done (2026-08-29: tsc ✓ · test 13/13 ✓ · lot→stock+avg ✓ · vendita esterna→ordine+FIFO+snapshot ✓ · build ✓) |
| R2 | **Replatform Medusa — F2**: storefront su Medusa — **done** (`src/lib/medusa/*`, catalogo shop/PDP/espansioni/home re-punted, cart→Medusa, checkout Payment Element + success, analytics, subscriber `order.placed` snapshot, **account cliente** login/register/My Account) | done (2026-08-29: tsc ✓ · test 104/104 ✓ · smoke shop/PDP/account ✓) |
| R3 | **Replatform Medusa — F3**: **backend LIVE su Oracle Cloud Free Tier** ✅ (2026-09-04: VM ARM + Docker (api+worker+redis+Caddy) + Neon `dcc_medusa` + `db:migrate`+seed + HTTPS `https://medusa.darkcardcollection.com/health` 200 + store API 200 + Admin 200). **Resta**: creare admin (`/app` onboarding) · abilitare provider Stripe sulla region Italia · verificare webhook Stripe (`/hooks/payment/stripe`) · Vercel env + deploy preview + cutover · remove Payload · feed in Merchant | backend live (2026-09-04: health 200 · store 200 · admin 200); passi dashboard utente + cutover open |
| R4 | **Replatform Medusa — F4**: promotions, returns/exchanges, backup, monitoring | open |

## 2. In attesa di input utente (`waiting-user`)

| # | Task | Note |
|---|------|------|
| W1 (#8) | Footer: dati aziendali reali (`BUSINESS` in `Footer.tsx`) e `CONTACT_EMAIL` — **decisione utente: lascia placeholder** (obbligatori per legge/Stripe prima del go-live definitivo) | placeholder mantenuti |
| W2 (REQ-15) | Backup/restore verificato (Neon) — processo di restore da verificare lato utente | da confermare |
| W3 (Stripe) | Pagamento reale con carta (modalità live) + verifica webhook `whsec_live_...` — l'utente conferma che funziona; API/endpoint verificati (checkout 200 locale/live, webhook endpoint attivo) | da confermare |
| W4 (Drive) | **Scontrini lotti**: env complete (email client_email + JSON chiave + folder id). ✅ `invalid_grant` risolto (drive.ts: il `client_email` del JSON ha precedenza sull'env — l'env può anche essere vuota). ✅ API Drive abilitata. **Bloccante attuale**: i service account NON possono scrivere nel "My Drive" (niente storage quota) → serve una **Shared Drive** ("Drive condiviso") con il service account `scontrini-dark-card-collection@...` come membro, e usare il suo ID come `GOOGLE_DRIVE_FOLDER_ID` (upload usa già `parents: [folderId]`, nessun codice da cambiare) | blocked (creare shared drive + condividerla col service account) |
| W6 (GitHub) | **Repo privata**: la repo è pubblica. Dopo `gh auth login` eseguire: `gh repo edit patternlover/dark-card-collection --visibility private` | waiting-user (auth gh) |
| W5 (Immagini) | 2 immagini in `images/` senza prodotto corrispondente (`bundle-ascesa-eroica.webp`, `scatola-da-collezione-mega-moonlit-tins-mega-gengar-ex.webp`) — caricare su Blob quando i prodotti esisteranno: `pnpm exec tsx scripts/upload-images-to-blob.ts` | waiting-user (prodotti da creare) |

## 3. Non-goal documentati (chiusi per scelta/by design — 2026-08-12)

| # | Voce | Motivo |
|---|------|--------|
| N1 (#1) | Account utente / storico ordini | Checkout senza account by design (ordine via email conferma) |
| N2 (#2) | Cart drawer / mini-cart | UX opzionale, non pianificata |
| N3 (#3) | Middleware per route protection | Protezione dashboard già assicurata dal layout (`isAuthed()` per rotta) |
| N4 (#4) | "No test per pagine/componenti" | Superato: suite E2E `tests-e2e/` 28 test + test live `tests-e2e-live/` |
| N5 (#5/#6) | Build/generate:types OOM su WSL | Note ambientali con workaround documentati (heap) |
| N6 (#7) | Stripe Products non sincronizzati | By design: checkout usa `price_data` ad-hoc, niente Stripe Products |
| N7 (#9) | Email conferma ordine senza `RESEND_API_KEY` | Dipende da env su Vercel; senza key l'ordine viene comunque creato |
| N8 (REQ-10) | Feed Google Sheets esposto | Moot: sistema Sheets rimosso |
| N9 (REQ-05) | Sessione revocabile | Logout esplicito + TTL cookie 7gg; SQL runner read-only (già protetto) — coperto |
| N10 (REQ-14) | MFA amministratori | Delegato a Google OAuth (2FA sull'account Google dell'allowlist) — coperto |

## 4. Chiusi con verifica (2026-08-12, sessione di smaltimento)

| # | Task | Verifica |
|---|------|----------|
| R0 | **Replatform Medusa — F0**: scaffold backend Medusa v2 in `apps/backend` (pacchetto indipendente), config moduli+Stripe gated+CORS, docker-compose, seed DCC (sales channels, region IT/EUR, location, shipping, demo product, api key), `db:migrate`+seed eseguiti, Admin `:9000/app` 200, `/store/products` ok, `tsc` 0 errori. Branch `feat/medusa-replatform` — dettagli `docs/project/medusa/REPLATFORMING.md` | done (verifica: migrate+seed ✓ · tsc ✓ · boot+Admin 200 ✓ · /store/products 1 prodotto ✓) |
| M1 | **Rivisitazione modali dashboard** — tutti i modali rivisitati (Ordini Vendita Esterna · Lotti Registra/Modifica · Magazzino senza Nuovo Prodotto · Listino Modifica Prodotto; Categorie/Collezioni invariati per decisione utente) + bug reali corretti (hook `Products.beforeChange` relist, cast id categoria/collezione, race toggle, Fragment key, refresh source names). **Mergiato in main** (`4104366`) — verifica: `pnpm lint` ✓ · `pnpm test` 75/75 ✓ · Full E2E su bundle prod 47/47 ✓ · CI ✓ · deploy Vercel Production ✓ | done (verifica completa) |

| # | Task | Verifica |
|---|------|----------|
| A1 (E5) | Remount dev-server → documentato in `AGENTS.md` (artefatto HMR, assente in prod) | lint/test/E2E |
| A2 (E6) | Doppio render transitorio `/shop` → documentato in `AGENTS.md` (hydration/streaming, assente in prod; test `.first()`) | lint/test/E2E |
| A3 (E7) | **"Modifica lotto"** implementato (`updatePurchase` + UI in `PurchasesSection`: riconciliazione stock `applyStockDelta`, `remaining_quantity` preservate) | E2E purchases 7/7 |
| A4 (E8) | Copertura E2E `/dashboard` (overview) + `/dashboard/sql` (query read-only) | E2E overview-sql 2/2 |
| D1 (REQ-08) | Header di sicurezza: aggiunto `Strict-Transport-Security` (HSTS) in `next.config.ts` | build + header check |
| D2 (REQ-11) | Errori generici verso il client: verificate tutte le API (nessuna fuga di stack/details) | review |
| D3 (REQ-13) | **Access control deny-by-default**: `src/payload/access.ts` + `access` su tutte le collection (write negati, read pubblico solo products/categories/collections) + collection `Users` esplicita (register negato) + `overrideAccess: true` su 99 chiamate interne. REST anonima già 403 | lint + E2E 28/28 |
| D4 (REQ-07) | Rate limiting: contact (pre-esistente) + `src/lib/rate-limit.ts` applicato a `/api/stripe/checkout` (30/min/IP) | review |
| D5 (REQ-09) | Proxy immagini: redirect validation (URL finale in allowlist), content-type `image/*` (no svg), limite 5MB | review |
| D6 (REQ-12) | Audit logging: `src/lib/audit.ts` + eventi (webhook, sale, product.update, order.status, purchase create/update/delete, login/logout dashboard) senza dati sensibili | review |

## 5. Storico chiuso (sessioni 2026-08-10 → 2026-08-12)

Elenco sintetico delle voci chiuse con verifica (dettagli nelle sessioni `docs/project/sessions/`):
- Modello inventario target (Fasi 1-5): Purchases a righe + FIFO + `effective_unit_cost`; pipeline `recordSale` condivisa; dashboard Lotti/Magazzino/Listino/Ordini/Messaggi; storefront `sold`→"Esaurito"; test 44/44 + E2E 28/28.
- E1-E4, E9, #20, #21: ambiente E2E locale, bug deadlock lotti, delete prodotto, migration validata, test-infra localStorage.
- Root cause live (Listino non scriveva): `payload_locked_documents_rels.purchases_id` mancante → migration `20260812_fix_locked_documents_rels.ts`; allineamento indice `orders_stripe_session_id` → `20260812_align_orders_stripe_session_index.ts`; **drift-check live: NESSUNO**; test live ok.
- Fix `push:false` in produzione; hardening toggle Listino; regressione hydration `console-clean.spec.ts`.
