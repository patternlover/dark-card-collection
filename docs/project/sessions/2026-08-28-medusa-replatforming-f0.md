# Sessione 2026-08-28 — Medusa replatforming · F0: scaffold backend

> Branch dedicato: `feat/medusa-replatform`. Piano maestro: `docs/project/medusa/REPLATFORMING.md`.

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo F0**: far girare un backend Medusa v2 funzionante in `apps/backend` (pacchetto
indipendente, fuori dal workspace pnpm di root), con Postgres+Redis locali, Admin su
`:9000/app`, seed base (region EUR, 5 sales channels, stock location, admin, demo product).
Nessuna modifica allo storefront (arriva in F2). `main` resta intatto.

**Ambito file:**
- `docs/project/medusa/REPLATFORMING.md` — piano maestro (nuovo)
- `apps/backend/**` — scaffold Medusa v2 (create-medusa-app, poi adattato)
- `apps/backend/docker-compose.yml` — Postgres 16 + Redis 7 (per chi ha Docker)
- `apps/backend/.env.example` — variabili dev
- `docs/project/sessions/2026-08-28-medusa-replatforming-f0.md` — questo file

**Ambiente (verificato):**
- Node v24.19.0 ✓ · pnpm 11.22 via `pnpm.cmd` (la shim `.ps1` è bloccata dalla execution policy) ✓
- **Niente Docker** su questa macchina → Postgres 18 + Redis installati in **WSL Ubuntu**
  (servizi su 127.0.0.1:5432/6379, raggiungibili da Windows via localhost forwarding) ✓
- `gh` non autenticato (task W6) → verifica CI via gh rimandata.

**Verifica prevista:** `medusa develop` boota · Admin `http://localhost:9000/app` 200 ·
`GET /store/products` restituisce il demo product · test spec base verdi.

---

## Changelog (compilato a fine sessione)

**Stato**: F0 completato e verificato. Branch `feat/medusa-replatform` (nuovo, da `main b25eaab`).

### Git
- `main`: committata e pushato la sessione "fix delete dashboard" (`b25eaab`) prima di creare il branch.
- Creato `feat/medusa-replatform`. `gh` non autenticato (W6) → CI non verificata via gh.

### Infra locale (WSL Ubuntu)
- Installati **Postgres 18** + **Redis** in WSL (apt). Servizi su `127.0.0.1:5432/6379`, raggiungibili da Windows.
- **Systemd abilitato** in WSL (`/etc/wsl.conf` `[boot] systemd=true`) → servizi enable e gestiti da systemd.
- `%USERPROFILE%\.wslconfig`: `vmIdleTimeout=-1` (evita idle-shutdown della VM durante job lunghi).
- ⚠️ Nota: la VM WSL **si spegne per idle** quando i job girano solo lato Windows (connessioni via bridge) → i job lunghi (migrate) devono girare **foreground dentro WSL** (pattern: `wsl -d Ubuntu -- bash script.sh` che lancia `node.exe` con interop). La migration è fallita 3 volte (57P01/57P03 "shutting down") finché non si è usato questo pattern.

### Scaffold `apps/backend` (Medusa 2.19.0)
- Generato con `create-medusa-app --skip-db --use-pnpm` in temp, copiato `apps/backend` nel repo come **pacchetto indipendente** (proprio `pnpm-workspace.yaml` con `allowBuilds`, proprio `pnpm-lock.yaml`) — nessuna interferenza col workspace pnpm di root (Vercel build invariata).
- Dipendenza aggiunta: `@medusajs/payment-stripe@2.19.0`.
- `medusa-config.ts`: CORS (storefront `:3000`, admin `:9000`), provider Stripe **gated** su `STRIPE_SECRET_KEY` (tipo `ModulesConfig` derivato da `defineConfig`).
- `docker-compose.yml` (Postgres 16 + Redis 7, per chi ha Docker), `.env.example` (committato), `.env` (dev, gitignored, secrets generati).
- **Seed DCC** in `src/migration-scripts/initial-data-seed.ts`: sales channels (Website/Vinted/eBay/Cardmarket/Altro), publishable API key, store "Dark Card Collection" (EUR), region "Italia" (IT), tax region IT, stock location "Magazzino IT", shipping options Standard (€9,99) + Spedizione Gratuita (€0), categoria "Sealed", demo product "Bundle Paldea Evolved" (published, 1 variant, €120, stock 6, metadata GA4-ready: product_type/set_name/language/condition).

### Verifica (F0)
- `pnpm install` (indipendente) ✓ · `tsc --noEmit` 0 errori ✓
- `medusa db:migrate` **completato** (via foreground-WSL node.exe) + seed eseguito ✓
- Seed verificato via SQL: 1 product published, variant Default (SKU PALDEA-EVOLVED-BOOSTER), prezzi 999/0/12000, 5 sales channel, region Italia eur, inventory 6, API key publishable, 2 shipping options, Magazzino IT, tax IT, categoria Sealed ✓
- **Server boot**: "Server is ready on port: 9000" (~24s) · **Admin `http://localhost:9000/app` → 200** ✓
- **`GET /store/products`** con `x-publishable-api-key: pk_e31b…` → 1 prodotto "Bundle Paldea Evolved" (1 variant) ✓
- Test unit: infrastruttura jest pronta (jest.config.js + swc), **nessun test ancora** (arrivano in F1 col modulo procurement).

### Note per prossime sessioni
- **Admin user**: da creare via onboarding UI (`http://localhost:9000/app`), oppure `node.exe cli.js user -e ... -p ...` (dev-only).
- **`redisUrl not found. A fake redis instance will be used.`** in dev: i moduli redis non leggono `REDIS_URL` da `.env` (non bloccante in dev; da verificare in F3 con env di produzione).
- Pattern dev su questa macchina: servizi WSL + `medusa develop` **foreground in WSL** (o Docker quando disponibile).
- F1: modulo `procurement` (lotti/FIFO/costo medio/margini) + Admin routes/widgets + porting test `purchase-math`/`record-sale`.