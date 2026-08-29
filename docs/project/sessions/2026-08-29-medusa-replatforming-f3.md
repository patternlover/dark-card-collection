# Sessione 2026-08-29 — Medusa replatforming · F3: prep cutover (deploy + feed Merchant)

> Branch dedicato: `feat/medusa-replatform`. Piano maestro: `docs/project/medusa/REPLATFORMING.md`.

## Plan

**Obiettivo F3**: preparare TUTTO il codice/config per il cutover in produzione
(backend Medusa su Railway + Neon + Upstash, feed Google Merchant, doc passi di
deploy/rimozione Payload). Il **deploy reale richiede l'infrastruttura dell'utente**
(credenziali Railway/Neon/Upstash/Stripe) e viene eseguito a valle, da sessioni dedicate.

## Changelog

### Code-prep (committato ora)
- **`apps/backend/Dockerfile`** — immagine node:22-slim, multi-stage (deps → build → run),
  `pnpm build` + `medusa start`.
- **`apps/backend/railway.json`** — config Railway (Dockerfile builder, `pnpm start`).
- **`apps/backend/.env.example`** — sezione PRODUZIONE (Neon/Upstash/Stripe/CORS/webhook).
- **Feed Google Merchant** (XML `g:`, conforme allo schema ecommerce già allineato):
  - `src/lib/feed/merchant-feed.ts` — build del feed dal catalogo Medusa (adapter): id/item_group_id,
    title, description, link, image_link, availability, price/sale_price, condition,
    product_type, google_product_category, custom_label_0 (set_name), **cost_of_goods_sold**
    (da `variant.metadata.cost_of_goods_sold`, calcolato dal modulo procurement).
  - `src/app/api/feed/products/route.ts` — `GET /api/feed/products` (XML, ISR 1h).
- Adapter Medusa esteso: `cost_of_goods_sold`, `google_product_category`, `set_name`.

### Passi F3 (utente + sessioni dedicate) — DA FARE
1. **Infra**: progetto Railway · nuovo DB **Neon** (SEPARATO dal Payload!) · **Upstash Redis**.
2. **Deploy backend**: servizio `api` (Dockerfile/railway.json, `pnpm start`) + servizio
   `worker` (stesso container, startCommand `npx medusa worker` — **obbligatorio** per
   eseguire subscriber/workflow async come `order.placed`).
3. **Env** su entrambi i servizi: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`,
   `AUTH_MFA_ENCRYPTION_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STORE_CORS`,
   `ADMIN_CORS`, `AUTH_CORS`.
4. **Migration + admin**: `npx medusa db:migrate` (una tantum, es. Railway shell/job) → creare
   admin su `https://<backend>/app`.
5. **Stripe**: webhook → `https://<backend>/hooks/payment/stripe`; abilitare provider `stripe`
   sulla region Italia (Admin). **Resend**: subscriber email conferma ordine (porting
   `order-email.ts`) — TODO F3.
6. **Frontend Vercel**: env `NEXT_PUBLIC_MEDUSA_BACKEND_URL` + `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
   + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; deploy branch → verifica `/shop`, PDP, checkout
   con carta reale, `/account`.
7. **Feed Merchant**: registrare `/api/feed/products` in Merchant Center.
8. **Rimozione Payload** (dopo cutover ok): delete `src/payload/`, `src/migrations/`,
   route `(payload)`/`/admin`, deps payload, dashboard Google OAuth; ops → Medusa Admin
   (Lotti `/app/lots`, vendite esterne, magazzino). I globals Payload (SiteSettings/Header)
   NON sono più consumati dallo storefront (nav/footer già statici).
9. **Verifica finale**: sitemap/JSON-LD, feed, GA4 (purchase con transaction_id = display_id).

### Verifica code-prep
- Storefront `pnpm lint` ✓ · backend tsc ✓ · test 104/104 ✓ (F2).

## Aggiunta — target deploy cambiato: Oracle Cloud Free Tier

**Decisione utente**: niente Railway (costo), niente home server (progetto futuro).
Backend in produzione su **Oracle Cloud Free Tier** (ARM VM, €0/mese) con Docker Compose.

**Nuovi artifact (committati):**
- `apps/backend/docker-compose.prod.yml` — api + worker + redis (self-hosted) + **caddy**
  (HTTPS automatico). Porta 9000 bindata su 127.0.0.1 (solo Caddy).
- `apps/backend/Caddyfile` — `medusa.darkcardcollection.com` → `api:9000`.
- `apps/backend/scripts/backup-medusa.sh` — pg_dump DB Neon + retention (cron).
- **Email conferma ordine (Resend)**: `apps/backend/src/lib/order-email.ts` (porting
  `order-email.ts` Payload, invio via Resend HTTP API) + subscriber `order-placed-email.ts`.
- `docs/project/medusa/DEPLOYMENT.md` — guida Oracle completa (VM, Docker, env, `db:migrate`,
  admin, Stripe region+webhook, Vercel, backup, checklist cutover).

**Default assunti (modificabili):** Postgres su **Neon free** (nuovo DB) · Redis self-hosted ·
subdomain `medusa.darkcardcollection.com` · Stripe **test → poi live**.

**Rimane** (passi F3 esecuzione, richiede l'infrastruttura utente): creare la VM Oracle,
DNS, `.env.prod`, `up -d`, `db:migrate`, admin, enable stripe region, webhook Stripe,
env Vercel, cutover, remove Payload, feed in Merchant — tutti documentati in `DEPLOYMENT.md`.