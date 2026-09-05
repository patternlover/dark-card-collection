# Setup

Guida rapida. Approfondimenti: [`README.md`](../../README.md) e [`docs/project/medusa/DEPLOYMENT.md`](../medusa/DEPLOYMENT.md).

## Storefront (Next.js)

```bash
pnpm install
# .env.local — vedi .env.example:
#   NEXT_PUBLIC_MEDUSA_BACKEND_URL · NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY · NEXT_PUBLIC_SITE_URL
pnpm dev          # http://localhost:3000
pnpm build        # next build
```

## Backend (Medusa, `apps/backend/`)

```bash
# Postgres + Redis locali (questa macchina: WSL; alternativa docker compose)
wsl -d Ubuntu -u root -- bash -lc "service postgresql start; service redis-server start"

cd apps/backend
pnpm install
cp .env.example .env        # DATABASE_URL / REDIS_URL / secret (64 hex)
pnpm exec medusa db:migrate # crea tabelle + seed (region, sales channels, location, api key)
pnpm dev                    # API + Admin http://localhost:9000/app
```

- **Admin**: `http://localhost:9000/app` (in prod: `https://medusa.darkcardcollection.com/app`). L'ops vive qui (ordini, lotti, magazzino, listino, clienti).
- **Publishable key**: da Admin → Settings → API Keys (serve allo storefront).

## Deploy di produzione

- **Backend** su Oracle Cloud Free Tier (Docker): `docs/project/medusa/DEPLOYMENT.md`.
- **Storefront** su Vercel (auto-deploy da `main`). Env in Vercel (scope Production + Preview):
  `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Nota

Il **checkout Stripe è PAUSATO** (vedi `docs/project/PENDING.md` → R3). Il backend è live e l'ordine è verificato via API; il flusso browser non è ancora completabile.