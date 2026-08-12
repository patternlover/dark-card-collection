# AGENTS.md — Dark Card Collection

## Identità
- E-commerce Pokémon TCG (sealed products, carte singole, slab) su **darkcardcollection.com**.
- Stesso dominio, due anime: **storefront pubblico** (shop, PDP, cart, checkout) e **`/dashboard`**, gestionale interno (acquisti merce, magazzino, annunci, vendite, messaggi dal contact form).
- Repo: `github.com/patternlover/dark-card-collection` · branch `main` · git identity: `patternlover` (edocavalcanti@gmail.com).
- Contesto completo: [`docs/project/overview.md`](docs/project/overview.md) (architettura, schema, decisioni) · `README.md` (setup, deploy) · [`docs/database/schema-and-flows.md`](docs/database/schema-and-flows.md) (schema DB) · [`docs/project/changelog.md`](docs/project/changelog.md) (storico) · [`docs/project/sessions/`](docs/project/sessions/README.md) (storico per sessione OpenCode: plan + changelog).

## Stack
- Next.js (App Router) + TypeScript strict
- Payload CMS 3.87 (collections + globals)
- PostgreSQL su Neon.io
- Stripe (Checkout embedded + webhooks) — **chiavi live**
- Vercel Blob Storage (immagini)
- Resend (`@payloadcms/email-resend`) per email conferma ordine
- Tailwind CSS 4 — stile neobrutalism, accent giallo `#FACC15`, footer tutto nero
- Vitest (unit test) + GitHub Actions (CI)

## Comandi (verifica SEMPRE prima di chiudere)
- Dev: `pnpm dev`
- Lint/typecheck: `pnpm lint` (= `tsc --noEmit`)
- Test: `pnpm test` (unit test in `tests/`)
- Build: `NODE_OPTIONS="--max-old-space-size=6144" pnpm build`

## Regole
- Usa SEMPRE `pnpm`, mai npm.
- Non toccare né committare mai `.env*` (contengono chiavi live Stripe/DB/Resend). Riferirsi a `.env.example` per i nomi delle variabili.
- Non cambiare mai git user.name/user.email.
- Modifiche a collections Payload richiedono: `payload generate:types` + nuova migration (`payload migrate:create`) prima di buildare.
- I prodotti vengono raggruppati per `title` (variants) — la logica è in `src/lib/group-products.ts`. Non esporre i variants nel frontend: shop e PDP mostrano solo il "parent product".
- Filtro visibilità storefront: `AND: [{ status: { in: ['listed', 'hold', 'sold'] } }, { is_visible: { equals: true } }]` — `sold` si mostra come "Esaurito" (non acquistabile); per nascondere un prodotto l'unico interruttore è `is_visible: false`.
- Il checkout crea `price_data` ad-hoc (niente Stripe Products); il webhook usa `product.metadata.payloadProductId` per creare l'order.
- Payload `id` è `string | number`: castare SEMPRE con `as number` quando si creano ordini.
- Test: se tocchi `group-products.ts`, `slug.ts` o la logica sticky ATC, aggiorna i test in `tests/`.
- Build process: `payload generate:db-schema && payload migrate && next build` — la schema DB è sempre in sync con il config Payload.
- Ogni sessione OpenCode deve avere un file plan+changelog in `docs/project/sessions/` (vedi README lì) e aggiornare `docs/project/changelog.md`. Creare il plan PRIMA di iniziare, compilare il changelog a fine sessione.
- Non inventare API di Payload/Stripe/Next: in caso di dubbio leggere PRIMA il codice esistente in `src/lib/` e `src/payload/`.
- Lingua: TUTTO il codice in inglese (identificatori, campi DB, collections, route nuove, commenti, commit). Risposte in chat, piani e changelog di sessione in italiano. Testi visibili ai clienti sullo storefront in italiano; anche le etichette UI della dashboard restano in italiano (com'è oggi, es. "Accedi con Google").
- REGOLA VARIANTS: un secondo Product con lo stesso `title` esiste SOLO se differisce per un attributo che il cliente vede o sceglie (grade, condition, language…). MAI creare Product/variant per differenze di acquisto (costo, luogo, data, lotto): quei dati vivono in Purchases. Sigillati identici = 1 solo Product con stock in `quantity`.

## Dashboard (gestionale interno)
- Sezioni (etichetta UI italiana ↔ nome nel codice inglese): **Lotti** ↔ `purchases` (inserimento acquisti/lotti, route `/dashboard/purchases`) · **Magazzino** ↔ `inventory` (creazione prodotti, stock, costo medio — vista su `products`) · **Listino** ↔ `listings` (gestione annunci: `price`, `status`, `is_visible`, `featured` — vista su `products`) · **Ordini** ↔ `orders` (+ margine, `sales_channel`, registrazione vendite esterne) · **Messaggi** ↔ `messages` (contact form). Magazzino e Listino sono due viste sulla stessa collection `products`: mai duplicare i dati per separarle.
- Accesso SOLO via Google OAuth con whitelist `DASHBOARD_GOOGLE_EMAILS` (logica in `src/lib/dash-auth`): nessuna pagina o API della dashboard deve essere raggiungibile senza auth.
- UI in `src/components/dashboard/`; accesso dati in `src/lib/db-query` e `src/lib/payload`.
- La dashboard scrive sugli stessi dati usati dallo storefront (Products, Orders, Messages): valutare sempre gli effetti collaterali lato sito pubblico (status, visibilità, grouping variants).
- Flusso merce (fonte di verità: overview.md § "Domain Model & Inventory Flow" — LEGGERLA prima di toccare Products/Purchases/dashboard): **Lotti** (`/dashboard/purchases`; oggi `/dashboard/acquisti`, da rinominare) con righe {prodotto, qty, costo unitario, luogo} → le righe incrementano lo stock in **Magazzino** (`Products.quantity` + costo medio) → **Listino** (`price` + `status` + `is_visible`) → **Ordini** (webhook: scala stock, consuma FIFO `remaining_quantity` delle righe d'acquisto, snapshot dell'`effective_unit_cost` sull'ordine → margine).
- Decisioni fissate: la vendita (webhook Stripe O vendita esterna) scala stock e consuma FIFO; quando lo stock arriva a 0 il sistema imposta `status: sold` + `availability: out_of_stock` in AUTOMATICO e il prodotto resta visibile come "Esaurito" (ATC disabilitato, il checkout valida qty ≤ stock lato server); un nuovo lotto che riporta stock > 0 ripristina automaticamente `status: listed` + `in_stock`. Nascondere = solo `is_visible: false`. Vendite esterne (Vinted ecc.): registrate a mano dalla sezione Ordini con `sales_channel`, stessa pipeline `recordSale` del webhook (ordine + stock + FIFO + snapshot costo). Costi extra del lotto ripartiti pro-quota sul valore delle righe: `effective_unit_cost = unit_cost × (1 + extra_costs/subtotale)` — TUTTA la matematica dei costi usa `effective_unit_cost` (dettagli in overview.md § "Extra costs allocation").
- Eco della regola variants: le differenze di acquisto NON creano mai variants né Product duplicati (vedi Regole).

## Tracking & Analytics (base presente — completamento rimandato)
- Obiettivo: quando si completerà il tracciamento (dataLayer → GTM → GA4 → BigQuery), il mapping deve essere quasi 1:1. Quindi il modello dati nasce già allineato allo schema ecommerce di Google: recommended events (`view_item_list`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `refund`…) + parametri `items`. Riferimento: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- Già esistente: eventi ecommerce base in `src/lib/analytics.ts` + Consent Mode v2 — estendere quel modulo, non duplicarlo.
- Le vendite esterne (`sales_channel` ≠ `website`) NON si spingono mai in GA4: l'analytics di sito misura solo il canale website; il fatturato completo di tutti i canali vive negli Ordini.
- Naming: dove non c'è un motivo contrario, usare i nomi Google o campi da cui derivano banalmente: `item_id`, `item_name`, `item_brand`, `item_category`…`item_category5`, `item_variant`, `price`, `quantity`, `currency`, `value`, `coupon`, `discount`. Non creare campi con questi nomi ma semantica diversa.
- Unità di tracking = il Product venduto: `item_id` = id/slug del Product, `quantity` = pezzi (per i sigillati anche > 1). Quando arriveranno i veri variants (singole gradate): `item_name` = `title` del parent, `item_variant` = attributo distintivo (es. grade), slab → `quantity` = 1.
- `transaction_id` = identificativo stabile e univoco dell'Order creato dal webhook Stripe (GA4 deduplica i purchase su questo campo).
- Campi custom TCG → item-scoped custom dimensions GA4 (max ~10 su proprietà standard, scegliere con criterio): es. `product_type` (sealed|single|slab), `set_name`, `language`, `condition`, `grading_company`, `grade`. TODO (owner): lista definitiva.
- Regola valida DA SUBITO: quando si creano/modificano campi su Products/Orders/Categories, verificare compatibilità con questa sezione; non rinominare/rimuovere campi rilevanti per il tracking senza aggiornarla. Niente dataLayer/GTM per ora.
- All'implementazione: mapping centralizzato in un unico modulo (es. `src/lib/analytics/`) che converte Product/Order → eventi GA4; GTM resta un pass-through del dataLayer.

## Struttura chiave
- `src/app/` → route (shop, products/[slug], cart, checkout, dashboard, api/*)
- `src/components/` → layout/, product/, sections/, ui/, dashboard/
- `src/lib/` → logica pura e client: payload, stripe, group-products, slug, dash-auth, db-query, order-email
- `src/payload/collections/` → Products, Categories, Collections, Orders, Media, Messages
- `src/payload/globals/` → SiteSettings, Header
- `src/migrations/` → migration Payload (genera da build)
- `tests/` → unit test Vitest

## Workflow AI
- Modello di default: **DeepSeek V4 Lite** su OpenCode. Modello "lite": dare istruzioni esplicite, task piccoli e ben delimitati, uno alla volta. Niente refactor multi-file speculativi.
- Flusso standard per ogni sessione: **Plan mode** → il piano prodotto diventa il file di sessione in `docs/project/sessions/` → conferma umana → **Build mode** per implementare il piano step per step, senza deviare.
- **All'inizio di ogni sessione/fase**: leggere `docs/project/sessions/OPEN-TASKS.md` (tracker dei task in sospeso) e verificare i task `open`/`blocked` che impattano l'ambito — gestirli o dichiararli esplicitamente prima di buildare. Aggiornare il tracker a fine fase/sessione (un task si chiude solo con verifica fatta).
- In Build mode: leggere i file per intero prima di modificarli; dopo ogni blocco di modifiche lanciare `pnpm lint` (+ test toccati), non solo a fine sessione.
- OpenCode free tier = ~200 richieste modello / 5h (condivise tra i modelli free): meglio poche richieste con spec dense che tanti botta-e-risposta.
- **Post-commit (obbligatorio dopo OGNI commit)**: `git push origin main` → verificare CI (`gh run watch <run-id> --exit-status`, attende l'esito) → verificare l'auto-deploy Vercel sulla live `https://darkcardcollection.com` (es. una rotta nuova risponde 200) → aggiornare changelog/tracker SOLO se push + CI + deploy sono andati a buon fine. Se qualcosa fallisce: correggere, ricommit, re-push, ri-verificare.
- Checklist di chiusura sessione: `pnpm lint` ✓ · `pnpm test` ✓ · se collections toccate → `payload generate:types` + migration ✓ · `docs/project/sessions/OPEN-TASKS.md` aggiornato ✓ · plan/changelog di sessione + `docs/project/changelog.md` aggiornati ✓ · push + CI + deploy verificati ✓.

## Note operative
- WSL: `tsc --noEmit` e `pnpm build` possono andare in OOM — usare la build con heap aumentata. `pnpm generate:types` può andare in timeout.
- Footer: dati business (BUSINESS in `Footer.tsx`) e `CONTACT_EMAIL` ancora placeholder.
- **`postgresAdapter` usa `push: false` in produzione** (`src/payload.config.ts`): la schema si applica con `payload migrate` nel build. NON riattivare `push: true`: causerebbe una sync schema a ogni cold-start serverless su Vercel → server actions lente/timeout → sintomo noto: la dashboard (es. Listino) non aggiorna i dati / dà errori. In dev (`NODE_ENV !== production`) il push resta attivo.
- **Idratazione (errore React #441)**: i componenti client NON devono leggere `window`/`localStorage`/`Date.now()` nel render (solo in `useEffect` + stato `mounted`). Qualsiasi attributo SSR che differisce dal client genera `Minified React error #441`. Regressione coperta da `tests-e2e/console-clean.spec.ts` (fallisce su errori di hydration nelle pagine chiave).
- **Migration obbligatorie anche per le tabelle di sistema Payload**: aggiungere/rimuovere una collection richiede di aggiornare anche le tabelle join gestite da Payload (`payload_locked_documents_rels`, `payload_preferences_rels`, ecc.) — ogni collection vi aggiunge una colonna `<collection>_id`. La mancanza (es. `purchases_id`) fa fallire con 500 OGNI write della dashboard ("column ... does not exist", vedi `20260812_fix_locked_documents_rels.ts`). Verifica drift: `SCHEMA_DRIFT_URI=<db> SCHEMA_DRIFT_REF_URI=<riferimento> pnpm exec tsx scripts/check-schema-drift.ts`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
