# Dark Card Collection

E-commerce Pokémon TCG (prodotti sigillati, carte singole, slab) — **storefront headless Next.js + backend Medusa** (open-source, self-hosted su Oracle Cloud Free Tier).

## Architettura

```
darkcardcollection.com (Vercel, storefront Next.js App Router)
   │  store API (publishable key) + admin API (secret key)
   ▼
medusa.darkcardcollection.com (Oracle Cloud Free Tier, Docker)
   ├── api (`pnpm start`) + worker (`MEDUSA_WORKER_MODE=worker`)
   ├── modulo custom `procurement` (lotti, FIFO, costo medio, margini)
   ├── subscribers (email conferma ordine Resend, snapshot costi)
   ├── Redis (self-hosted) · PostgreSQL (Neon, DB `dcc_medusa`) · Caddy (HTTPS)
   └── Medusa Admin (gestione ordini/prodotti/inventario/clienti)
```

> **⚠️ Stato checkout**: il flusso Stripe (Payment Element) è **PAUSATO**. Il sito è live e il backend funziona (ordine verificato via API), ma **gli acquisti non sono ancora completabili dal browser**. Vedi [PENDING.md](docs/project/PENDING.md) → R3.

## Struttura del repo

```
├── src/                    # Storefront Next.js (catalogo, cart, checkout, account)
│   ├── lib/medusa/         # Client store API Medusa (products, cart, customer, checkout)
│   ├── lib/feed/           # Feed Google Merchant (XML)
│   └── app/                # Route (shop, products/[slug], cart, checkout, account)
├── apps/backend/           # Backend Medusa 2.19 (modulo procurement, workflows, subscribers)
├── tests/                  # Test Vitest (storefront: pure funzioni + adapter Medusa)
├── docs/                   # Documentazione (overview, DB, sessioni, plan Medusa)
└── scripts/                # Script utili storefront
```

## Stack

| Componente | Scelta |
|---|---|
| Storefront | Next.js 16 (App Router) + React + Tailwind 4 |
| Commerce backend | **Medusa v2** (`apps/backend`) |
| Database | PostgreSQL su **Neon** (DB `dcc_medusa`) |
| Cache/event bus/workflow | Redis self-hosted |
| Pagamenti | Stripe (via provider Medusa) — **pausato** |
| Email | Resend |
| Deploy | Vercel (storefront) + Oracle Cloud Free Tier (backend, Docker) |

## Avvio locale

1. **Backend** (vedi `apps/backend/README.md` / `docs/project/medusa/DEPLOYMENT.md`):
   ```bash
   # Postgres + Redis (WSL su questa macchina, o docker compose)
   wsl -d Ubuntu -u root -- bash -lc "service postgresql start; service redis-server start"
   cd apps/backend
   pnpm install
   cp .env.example .env      # compila DATABASE_URL/REDIS_URL/secret
   pnpm medusa db:migrate    # crea tabelle + seed
   pnpm dev                  # API + Admin su http://localhost:9000/app
   ```
2. **Storefront**:
   ```bash
   pnpm install
   # .env.local: NEXT_PUBLIC_MEDUSA_BACKEND_URL + NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
   pnpm dev                  # http://localhost:3000
   ```

> Nota macchina locale (Windows + WSL): la VM WSL va in idle-shutdown con job Windows-only → per job lunghi (migrate/build) esegui foreground dentro WSL. Dettagli in `docs/project/sessions/2026-08-28-medusa-replatforming-f0.md`.

## Comandi

```bash
pnpm lint        # tsc --noEmit (storefront)
pnpm test        # Vitest
pnpm build       # next build
# backend (in apps/backend):
pnpm exec tsc --noEmit   # typecheck
pnpm exec jest --silent --runInBand --forceExit   # test unit (TEST_TYPE=unit)
```

## Documentazione

- [`docs/project/overview.md`](docs/project/overview.md) — architettura, dominio, decisioni
- [`docs/database/schema-and-flows.md`](docs/database/schema-and-flows.md) — schema DB Medusa + flussi
- [`docs/project/medusa/REPLATFORMING.md`](docs/project/medusa/REPLATFORMING.md) — piano di migrazione (completato)
- [`docs/project/medusa/DEPLOYMENT.md`](docs/project/medusa/DEPLOYMENT.md) — deploy backend Oracle
- [`docs/project/PENDING.md`](docs/project/PENDING.md) — tracker task in sospeso (l'unico punto)
- [`docs/project/sessions/`](docs/project/sessions/README.md) — storico sessioni

## Deployment

- **Storefront**: Vercel (auto-deploy da `main`). Env: `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Backend**: VM Oracle + Docker Compose (`apps/backend/docker-compose.prod.yml`), guida in `DEPLOYMENT.md`.
- **Admin operativo**: Medusa Admin → https://medusa.darkcardcollection.com/app (l'ops vive lì: ordini, lotti, vendite esterne, margini, inventory).

## License

Privato.