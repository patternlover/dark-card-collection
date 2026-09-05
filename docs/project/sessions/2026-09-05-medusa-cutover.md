# Sessione 2026-09-05 — Cutover: live su Medusa + rimozione Payload + docs

> Branch `feat/medusa-replatform` → `main` (`56fcc44`, docs `2b57972`). Piano maestro: `docs/project/medusa/REPLATFORMING.md`.

## Plan

1. Fix analytics: `dataLayer.push({ ecommerce: null })` prima di ogni evento ecommerce GA4 (i begin_checkout si accumulavano).
2. **Cutover**: merge su `main` del branch Medusa completo.
3. **Rimozione Payload** dal codice (commerce + admin + dashboard + API + deps).
4. Verifica prod live e aggiornamento di tutta la documentazione per il prossimo modello.

## Changelog

### Analytics
- `src/lib/analytics.ts`: `pushEcommerce()` fa `dataLayer.push({ ecommerce: null })` prima dell'evento (pattern GA4). Niente più eventi accumulati.

### Cutover + rimozione Payload (commit `56fcc44`)
- **Rimossi**: `src/payload`, `src/migrations`, `(payload)/admin`, `/dashboard` + OAuth Google (`api/auth`), `/api/stripe` (checkout/order/webhook), components dashboard/admin, lib Payload (`payload`, `dash-auth`, `db-query`, `record-sale`, `inventory`, `order-email`, `audit`, `rate-limit`, `drive`, `purchase-math`, `sale-options`, `listings`, `labels`, `stripe`), file generati (`payload-generated-schema`, `payload-types`), test Payload/dashboard, script Payload.
- `package.json`: deps Payload/@payloadcms/googleapis/pg rimosse; `build` = `next build`; lockfile aggiornato.
- `next.config.ts`: senza `withPayload`. `tsconfig.json`: senza `@payload-config`.
- **Contact form** → invio via **Resend** (senza DB). **`llms-full.txt`** → catalogo da Medusa (`listCatalogProducts`).
- **Verifica**: `tsc` 0 · test 32/32 · `next build` ok · prod live: `/shop` 200 (prodotto Medusa), home 200, checkout/account/feed/sitemap 200, **`/admin` e `/dashboard` 404**.

### Docs (commit `2b57972` + questa sessione)
- `README.md` riscritto (snello, Medusa).
- `AGENTS.md` riscritto per la nuova architettura (eredità per il prossimo modello).
- `docs/project/overview.md` e `docs/database/schema-and-flows.md` riscritti per Medusa.
- `PENDING.md` ripulito (task Payload obsolete rimosse; resta checkout Stripe aperto).
- Indice sessioni aggiornato + questo file.

### Note per prossime sessioni
- **Checkout Stripe PAUSATO** = unico blocco per riaprire le vendite (vedi PENDING R3).
- La VM Oracle: `docker compose -f docker-compose.prod.yml up -d` in `/opt/dcc/apps/backend`; migrazioni via `docker compose ... run --rm api npx medusa db:migrate`.
- Credenziali admin Medusa: `admin@darkcardcollection.com` (password su Admin prod, cambiarla).