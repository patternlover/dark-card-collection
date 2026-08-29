# REPLATFORMING — Dark Card Collection su Medusa.js

> **Stato**: **F0 ✅ · F1 ✅ · F2 ✅** · **F3 🔶 code-prep fatto** (Dockerfile, railway.json, env prod, feed Merchant; deploy/cutover richiede l'infrastruttura utente — vedi sessione F3). Prossimo: eseguire i passi F3 e il cutover.
> Branch dedicato: `feat/medusa-replatform`.
> Questo documento è il **piano maestro** della migrazione del commerce su Medusa v2.
> Decisione utente 2026-08-28: **Full su Medusa** — Medusa Admin diventa l'unica UI
> operativa; Payload CMS viene **rimosso del tutto**; **account cliente abilitati**;
> dati in **fresh start** (nessun import 1:1). Tutto il lavoro di migrazione vive su
> `feat/medusa-replatform` (mai su `main` finché non si fa il cutover).

---

## 1. Obiettivo

Sostituire il commerce custom attuale (Payload CMS 3.87 su PostgreSQL/Neon + Stripe)
con **Medusa v2** come headless commerce engine, mantenendo lo storefront Next.js
(16, App Router) come frontend. La logica di dominio bespoke (lotti d'acquisto, FIFO,
costo medio, margini, canali di vendita esterni, feed Google Merchant) viene reimplementata
come **modulo custom Medusa** + estensioni Admin.

## 2. Decisioni chiave (confermate 2026-08-28)

| # | Decisione | Scelta |
|---|-----------|--------|
| D1 | Architettura | **Full su Medusa**: Medusa Admin unica UI operativa |
| D2 | Deploy backend | **Railway** (2 servizi: backend + worker); Postgres su **Neon** (nuovo DB); Redis su **Upstash**. Storefront resta su Vercel |
| D3 | Payload | **Rimosso del tutto** (commerce + CMS). Contenuti → pagine statiche in Next.js; `SiteSettings`/`Header` → `src/config.ts` |
| D4 | Account cliente | **Abilitati** (login/register/My Account) — supera il non-goal N1 legacy |
| D5 | Migrazione dati | **Fresh start**: seed in Medusa, niente import 1:1; storico ordini Payload resta legacy read-only |
| D6 | Git | Tutto su `feat/medusa-replatform`; `main` resta intatto fino al cutover |

## 3. Architettura target

```
Browser (storefront Next.js su Vercel)
   │  store API (publishable key) / admin API (secret key)
   ▼
Medusa backend (Node long-running su Railway: API + worker)
   ├── moduli core: product, pricing, cart, order, customer, sales-channel,
   │                inventory, stock-location, fulfillment, payment, promotion, auth, notification
   ├── plugin payment-stripe
   ├── modulo custom `procurement`  (lotti, FIFO, costo medio, margini)
   ├── subscribers (email ordine via Resend)
   └── estensioni Admin (routes Lotti/Vendite esterne/Magazzino + widgets margine/costing)
   │
   ├── PostgreSQL (Neon)
   └── Redis (Upstash)  — event bus + workflow engine
```

## 4. Repo layout (basso rischio)

Lo storefront Next.js **resta alla root** (build Vercel invariata). Medusa vive in
`apps/backend` come **pacchetto indipendente** (lockfile proprio, fuori dal workspace
pnpm di root — nessuna interferenza con la build storefront).

```
feat/medusa-replatform
├── apps/backend/              # Medusa v2 (scaffold create-medusa-app, adattato)
│   ├── medusa-config.ts       # moduli + Stripe + CORS (storefront http://localhost:3000)
│   ├── docker-compose.yml     # Postgres 16 + Redis 7 (dev locale; qui WSL come fallback)
│   ├── .env.example
│   ├── src/
│   │   ├── modules/procurement/   # modulo custom: PurchaseLot/PurchaseLine/FIFO/costo
│   │   ├── workflows/             # create-lot, record-sale, notify-order
│   │   ├── subscribers/           # order.placed → email Resend
│   │   ├── links/                 # procurement↔order, procurement↔inventory
│   │   ├── admin/                 # widgets + routes custom (F1)
│   │   └── scripts/seed.ts        # region EUR, sales channels, location, admin, demo product
│   └── package.json               # indipendente da root
├── src/lib/medusa/            # layer integrazione storefront (F2)
├── src/config.ts              # sostituisce globals Payload (F2)
├── src/lib/feed/merchant-feed.ts   # generatore Google Merchant (F3)
└── docs/project/medusa/REPLATFORMING.md   # questo file
```

## 5. Mappatura dominio → Medusa

| Attuale (Payload) | Medusa v2 | Note |
|---|---|---|
| `products` (riga = item, `quantity`=stock) | Product + **1 variant** (sealed) + inventory item + stock level | Location unica "Magazzino IT" |
| Varianti buyer-visible (grade/condition/language) | Product **options** → variants | Modello nativo Medusa |
| `is_visible` | `published`/`draft` | sold-out = stock 0 → frontend "Esaurito" |
| `status` listed/hold/sold | published + metadata `preorder`; sellability = stock | **Niente server-status lifecycle**: lo stock 0 disabilita l'ATC |
| `price`/`sale_price` (EUR) | Region EUR + price set | compare-at: decisione in F1 |
| `categories`/`collections` | product_categories (tree) / collections | 1:1 |
| Ordini + `sales_channel` | Orders + **sales channels** (`website`/`vinted`/`ebay`/`cardmarket`/`other`) | 1:1 |
| `orders.items[].unit_cost_snapshot` | line item metadata (via link procurement) | margine in Admin widget |
| Stripe checkout | `@medusajs/payment-stripe` (payment collection) | UX checkout cambia leggermente (F2) |
| Shipping IT, gratis ≥80€ | fulfillment set + shipping options + price rules | 1:1 |
| Email conferma (Resend) | subscriber `order.placed` | porting `order-email.ts` |
| **Lotti + FIFO + `effective_unit_cost` + margini** | **modulo custom `procurement`** | il gap principale, risolto custom |
| Google Merchant feed | custom feed (F3) | resta custom |
| GA4 analytics | frontend, dati da Medusa | `transaction_id` = order id |
| Dashboard Google OAuth | Medusa Admin (email/password + invite) | SSO possibile dopo |

## 6. Modulo custom `procurement` (cuore bespoke)

- **Entity** (MikroORM):
  - `PurchaseLot`: `purchase_date`, `source_type`, `source_name`, `extra_costs`, `notes`, `receipt_url` (Google Drive), `total_cost`.
  - `PurchaseLine`: → variant (via inventory item id), `quantity`, `unit_cost`, `effective_unit_cost`, `remaining_quantity` (FIFO).
- **Servizi**: `createLot` (calcolo `effective_unit_cost = unit_cost × (1 + extra_costs/subtotal)`; edge case subtotal 0 → split uguale per unità; incremento stock inventory module; ricalcolo costo medio) · `consumeFIFO(variantId, qty)` (consuma le righe più vecchie, ritorna {lineId, qty, effective_unit_cost}) · `getAverageCost(variantId)`.
- **Workflow**: `recordSale` (website: order Medusa con payment; esterne: sales channel senza payment → snapshot costo su line item via link) · `createPurchaseLot`.
- **Admin**: routes custom (Lotti CRUD + upload scontrino Drive, Vendite esterne, Magazzino) + widgets (margine su order detail, costing su product detail).
- **Test**: porting dei test `purchase-math`/`record-sale`/`inventory` in spec del modulo.

## 7. Fasi (deliverable + verifica)

| Fase | Deliverable | Verifica |
|------|-------------|----------|
| **F0** ✅ | Scaffold Medusa in `apps/backend`, docker-compose, config moduli+Stripe+CORS, seed (region EUR, 5 sales channel, location, admin, demo product), Admin su `:9000/app` | **done** (2026-08-28): migrate+seed ✓, `tsc` ✓, boot ✓, Admin 200 ✓, `/store/products` ✓ |
| **F1** ✅ | Modulo `procurement` (entity/service/workflow/links) + Admin routes/widgets + test | **done** (2026-08-29): tsc ✓, test 13/13 ✓, lot→stock↑+avg cost 27 ✓, vendita esterna→ordine completed+FIFO 5→3+snapshot 54+margin 66 ✓, `medusa build` ✓ |
| **F2** ✅ | `src/lib/medusa/*`, storefront su store API (shop/PDP/home/collections), cart→Medusa, checkout Stripe, success page, analytics, account cliente, contenuti statici | **done** (2026-08-29): tsc ✓ · test 104/104 ✓ · smoke `/shop`+PDP+account flow ✓ |
| **F3** 🔶 | Deploy Railway (backend+worker, Neon, Upstash), env storefront→prod, **rimozione Payload** (src/payload, migrations, /admin, OAuth dashboard, deps), feed Merchant, sitemap/JSON-LD | code-prep done (2026-08-29: Dockerfile, railway.json, env prod, feed `/api/feed/products`); deploy/cutover = passi sessione F3 (richiede infra utente) |
| **F4** | Promotions, returns/exchanges, backup, monitoring | — |

## 8. Ambiente

### Variabili (F0)
```
DATABASE_URL=postgres://medusa:medusa@localhost:5432/medusa_dev   # dev (WSL/docker-compose)
REDIS_URL=redis://localhost:6379                                  # dev
MEDUSA_JWT_SECRET=…   COOKIE_SECRET=…
STRIPE_SECRET_KEY=…   STRIPE_WEBHOOK_SECRET=…   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=…
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=…  NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
RESEND_API_KEY=…      GOOGLE_DRIVE_* (scontrini lotti)
```

### Comandi (dev locale)
```bash
# Postgres + Redis (due alternative)
docker compose -f apps/backend/docker-compose.yml up -d     # se Docker c'è
# oppure (questa macchina): servizi in WSL Ubuntu
wsl -d Ubuntu -u root -- bash -lc "service postgresql start; service redis-server start"

cd apps/backend
pnpm install
npx medusa db:migrate        # oppure `pnpm medusa db:migrate`
npx medusa user -e admin@darkcardcollection.com -p '<forte>'  # crea admin (o via Admin UI)
npx medusa seed              # se il seed è registrato
npx medusa develop           # server :9000, Admin :9000/app
```

## 9. Rischi / decisioni aperte

1. **Compare-at/sale price** in Medusa v2 (custom field vs price list) — decidere in F1.
2. **UX checkout**: Payment Element sostituisce la pagina Stripe Embedded — conferma in F2.
3. **Auth Admin**: email/password (invite) sostituisce Google OAuth — conferma in F3.
4. **Immagini**: URL (Blob/Cardmarket + proxy) come metadata product — niente file module Medusa.
5. Node **≥20.19** richiesto da Medusa 2.19 (macchina: Node 24 ✓).
6. WSL non usa systemd → abilitato (`/etc/wsl.conf` systemd=true); **VM WSL va in idle-shutdown** e interrompe i job DB quando girano solo lato Windows → eseguire i job long-running **foreground dentro WSL** (pattern: `wsl -d Ubuntu -- bash script.sh` con `node.exe` in interop) o usare Docker/cloud. `.wslconfig` `vmIdleTimeout=-1` impostato.
7. `redisUrl not found` in dev: i moduli redis non leggono `REDIS_URL` dal `.env` (fake redis usato) — non bloccante in dev; verificare in produzione (F3).

## 10. Non-goal

- Niente import 1:1 dei dati legacy (fresh start per decisione).
- Niente replica dei flussi ops nel frontend (restano in Medusa Admin).
- Niente SSO custom per Admin (email/password; eventuale SSO rimandato).