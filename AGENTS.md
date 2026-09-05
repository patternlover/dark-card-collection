# AGENTS.md — Dark Card Collection

## Identità
- E-commerce Pokémon TCG (prodotti sigillati, carte singole, slab) su **darkcardcollection.com**.
- **Storefront** headless: Next.js (App Router) in questa repo (root) → `src/`.
- **Commerce backend**: **Medusa v2** in `apps/backend/` (headless engine + Admin). L'ops vive in **Medusa Admin** (`https://medusa.darkcardcollection.com/app`), NON in questa repo.
- Repo: `github.com/patternlover/dark-card-collection` · branch principale `main` · git identity: `patternlover` (edocavalcanti@gmail.com).
- Contesto completo: `docs/project/overview.md` · `docs/database/schema-and-flows.md` · `docs/project/medusa/REPLATFORMING.md` · `docs/project/PENDING.md` · `docs/project/sessions/`.

> **⚠️ CHECKOUT STRIPE PAUSATO** (PENDING → R3): il flusso browser (Payment Element) non è ancora funzionante. Il backend Medusa è live e l'ordine è verificato via API (provider di sistema). **NON dare per scontato che un acquisto dal sito funzioni.**

## Stack
- Storefront: Next.js 16 (App Router) + React + Tailwind 4 + TypeScript strict.
- Backend: Medusa 2.19 (`apps/backend/`), PostgreSQL su Neon (DB `dcc_medusa`), Redis self-hosted, Stripe (provider Medusa), Resend.
- Deploy: storefront su **Vercel** (auto-deploy da `main`); backend su **Oracle Cloud Free Tier** (Docker Compose, guida `docs/project/medusa/DEPLOYMENT.md`).
- Test: Vitest (storefront `tests/`) + jest unit (backend `apps/backend/src/**/__tests__`).

## Comandi (verifica SEMPRE prima di chiudere)

### Storefront (root)
```bash
pnpm lint          # tsc --noEmit
pnpm test          # Vitest
pnpm build         # next build
pnpm dev           # http://localhost:3000
```

### Backend (`apps/backend/` — pacchetto indipendente, lockfile proprio)
```bash
pnpm install
pnpm exec tsc --noEmit
pnpm exec jest --silent --runInBand --forceExit     # con TEST_TYPE=unit
pnpm dev                                            # API+Admin http://localhost:9000/app
# migrazioni Medusa (solo se tocchi le collection/moduli):
npx medusa db:generate <module>   # genera migration da DML
npx medusa db:migrate             # applica (crea tabelle + seed)
```
> In produzione il backend gira in Docker: `docker compose -f docker-compose.prod.yml up -d` sul VPS Oracle (vedi `DEPLOYMENT.md`).

## Regole
- **Lingua**: codice in inglese; chat/piani/changelog in italiano; testi storefront in italiano (dashboard Medusa può restare in inglese).
- **Mai toccare/committare `.env*`** (chiavi live Stripe/Neon/Resend). Riferirsi a `.env.example`.
- **Modifiche a collection/moduli Medusa** richiedono `medusa db:generate` + `db:migrate` prima del build.
- **Variants**: un secondo Product con lo stesso `title` esiste SOLO per differenze visibili al cliente (grade/condition/language). Differenze di acquisto (costo/luogo/data/lotto) → mai Product: vivono in **PurchaseLot/PurchaseLine** (modulo `procurement`).
- **Visibilità storefront**: prodotti `published` in Medusa + stock (inventory). Stock 0 → "Esaurito" (frontend, ATC disabilitato). Nascondere = `draft` in Medusa.
- **Analytics**: ogni evento ecommerce GA4 va preceduto da `dataLayer.push({ ecommerce: null })` (pattern già in `src/lib/analytics.ts`). Vendite esterne (`sales_channel ≠ website`) MAI in GA4.
- **Cart**: Medusa cart (server-side); `cart_id` in localStorage; id valido inizia con `cart_`.
- **Non inventare API Medusa/Stripe/Next**: leggere prima `src/lib/medusa/`, `apps/backend/src/`, e i package installati in `apps/backend/node_modules`.
- **Deploy/commit**: push su `main` → CI GitHub Actions → auto-deploy Vercel. Verificare la rotta live (`https://darkcardcollection.com/...`) dopo ogni deploy.

## Dominio e flusso merce (fonte di verità: `docs/project/overview.md` § "Domain Model")
- **Lotti** (`purchase_lot` + `purchase_line`) → righe con `effective_unit_cost` (allocazione extra pro-quota) e `remaining_quantity` (FIFO).
- Un lotto incrementa lo **stock** (inventory module) e ricalcola il **costo medio** su `variant.metadata.cost_of_goods_sold`.
- Una vendita (checkout website o **vendita esterna**) consuma FIFO, decrementa stock e salva lo **snapshot costo** su `order.metadata.dcc_cost_snapshots` → **margine** per vendita (widget in Admin).
- Backend bespoke in `apps/backend/src/modules/procurement/` + `workflows/` + `subscribers/` (order.placed → snapshot FIFO + email Resend).

## Operatività (Medusa Admin, NON nella repo)
- Lotti, Magazzino (stock/costo medio), Listino (prezzo/status/visibilità), Ordini (+ vendite esterne, margini), Clienti.
- Admin locale: `http://localhost:9000/app` · Prod: `https://medusa.darkcardcollection.com/app`.

## Nota ambiente (Windows + WSL)
- Postgres/Redis locali in WSL (Ubuntu), servizi systemd. La VM WSL va in idle-shutdown con job Windows-only → per job lunghi (migrate/build medusa) eseguirli **foreground dentro WSL** (interop `node.exe`). Pattern documentato nella sessione F0.

## Flusso di sessione (obbligatorio)
1. Leggere **`docs/project/PENDING.md`** all'inizio (task open/blocked che impattano l'ambito → gestirli o dichiararli).
2. Scrivere il **plan** di sessione in `docs/project/sessions/YYYY-MM-DD-titolo.md` PRIMA di iniziare.
3. A fine sessione: compilare il **changelog** di sessione + `docs/project/changelog.md` + aggiornare `PENDING.md` (mai task `done` senza verifica: `pnpm lint`, `pnpm test`, build/E2E dove applicabile).
4. Commit + push + verifica CI e deploy live.

## Struttura chiave
```
src/app/                    # Storefront: shop, products/[slug], cart, checkout, account, api/*
src/components/             # layout, product, sections, seo, ui
src/lib/medusa/             # Client store API Medusa (products.ts, cart.ts, customer.ts, client.ts)
src/lib/feed/               # Feed Google Merchant (XML)
src/lib/analytics.ts        # GA4 ecommerce (con clear dataLayer)
tests/                      # Vitest storefront
apps/backend/
  medusa-config.ts          # moduli (procurement, redis, payment-stripe) + CORS
  docker-compose.prod.yml   # api+worker+redis+caddy (produzione Oracle)
  src/modules/procurement/  # modulo custom (lotti/FIFO/costo medio)
  src/workflows/            # create-purchase-lot, record-external-sale
  src/subscribers/          # order-placed (snapshot FIFO + email Resend)
  src/migration-scripts/    # seed (region IT/EUR, sales channel, location, api key)
docs/                       # overview, DB, medusa (REPLATFORMING/DEPLOYMENT), sessioni
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->