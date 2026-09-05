# DARK CARD COLLECTION - Project Context

## Overview

E-commerce Pokémon TCG (prodotti sigillati, carte singole, slab). **Storefront headless Next.js + backend Medusa v2** self-hosted.

- **Live URL**: https://darkcardcollection.com
- **Medusa Admin (ops)**: https://medusa.darkcardcollection.com/app
- **Backend API**: https://medusa.darkcardcollection.com (store API con publishable key)
- **GitHub**: https://github.com/patternlover/dark-card-collection

> **⚠️ CHECKOUT STRIPE PAUSATO**: il sito è live e il backend Medusa funziona (ordine verificato via API), ma il flusso di pagamento browser (Stripe Payment Element) NON è ancora funzionante. Vedi `docs/project/PENDING.md` (R3).

## Tech Stack

| Componente | Scelta |
|-----------|--------|
| Storefront | Next.js 16.3 (App Router) + React 19 + Tailwind 4 |
| Commerce backend | **Medusa 2.19** (`apps/backend/`) |
| Database | PostgreSQL su **Neon** (DB `dcc_medusa`) |
| Cache / event bus / workflow | Redis self-hosted (VPS) |
| Pagamenti | Stripe via provider Medusa (pausato) |
| Email | Resend (conferma ordine + contact form) |
| Hosting storefront | Vercel (auto-deploy da `main`) |
| Hosting backend | Oracle Cloud Free Tier (Docker Compose: api + worker + redis + Caddy) |
| Test | Vitest (storefront) + jest (backend) |
| CI | GitHub Actions |

## Architettura

```
darkcardcollection.com (Vercel)
   │  store API (x-publishable-api-key)
   ▼
medusa.darkcardcollection.com (Oracle Cloud, Docker)
   ├── api      (`pnpm start`)        — REST API + Admin (served su :9000/app)
   ├── worker   (`MEDUSA_WORKER_MODE=worker medusa start`) — event bus / workflow / subscribers
   ├── redis    — event bus + workflow engine + cache
   ├── caddy    — reverse proxy HTTPS
   └── Neon     — PostgreSQL (dcc_medusa)
```

## Domain Model & Inventory Flow

> Fonte di verità operativa. La **golden rule**: un *variant* esiste SOLO quando il cliente vede una differenza (grade/condition/language). Differenze di acquisto (costo/luogo/data/lotto) vivono nei **lotti**, mai nei Product.

### Glossario
- **Product** (Medusa) = una riga di catalogo vendibile. Oggetti fisici identici = UN product con 1 variant "Default" e stock sull'inventory.
- **Variant** (Medusa) = differenza visibile (grade/condition/language) — per i sealed è uno solo.
- **PurchaseLot / PurchaseLine** (modulo `procurement`) = l'evento d'acquisto: data, fonte, extra_costs, righe (variant, qty, unit_cost, `effective_unit_cost`, `remaining_quantity`).
- **Stock** = inventory level del variant (incrementato dai lotti, decrementato dalle vendite).
- **Listing** = fare un product vendibile: `published` in Medusa + stock > 0.
- **Margine** = ricavo − Σ(qty × `effective_unit_cost`) dal snapshot FIFO su `order.metadata.dcc_cost_snapshots`.

### Extra costs allocation
`extra_costs` (spese lotto) ripartiti pro-quota: `effective_unit_cost = unit_cost × (1 + extra_costs/subtotal)`; se subtotal 0, split uguale per unità. Tutti i calcoli costo (costo medio, FIFO, snapshot, margini) usano `effective_unit_cost`.

### Flusso
1. **Lotto** (Admin → Lotti): registri un lotto con righe → stock↑, costo medio su `variant.metadata.cost_of_goods_sold`.
2. **Magazzino** (Admin): stock, costo medio, storico acquisti per variant.
3. **Listino** (Admin): prezzo, status, visibilità; stock 0 → frontend "Esaurito" (ATC disabilitato); nascondere = `draft`.
4. **Vendita** (Admin Ordini → Vendita esterna, o checkout website): `recordExternalSaleWorkflow` / checkout → FIFO consuma `remaining_quantity`, decrementa stock, snapshot costo su ordine.

## Storefront — accesso dati (Medusa)

- **`src/lib/medusa/`**: client fetch tipato (publishable key, senza SDK) + adapter `toStorefrontProduct` (Medusa product/variant → shape storefront) + cart/customer ops.
- **Pagine** server: `/shop`, `/shop/bestsellers`, `/shop/new-arrivals`, `/shop/espansioni(+/[slug])`, `/products/[slug]`, sitemap, feed — leggono da Medusa store API.
- **Cart**: Medusa cart (server-side) via `CartProvider` (`src/hooks/useCart.tsx`); `cart_id` in localStorage (`dcc-medusa-cart`, inizia con `cart_`).
- **Checkout**: `/api/medusa/checkout` (shipping + payment collection + sessione Stripe) + pagina Payment Element; **PAUSATO**.
- **Account**: `AuthProvider` (`src/hooks/useAuth.tsx`) + `/account` (login/register/My Account con storico ordini via `/store/orders`).

## Decisioni chiave

1. **Payload rimosso** (2026-09-05): tutto il commerce è su Medusa; l'ops vive in Medusa Admin. Contenuti (guide/info/faq) = pagine statiche.
2. **Cart**: Medusa cart server-side, non localStorage di item.
3. **Checkout**: Payment Element con client_secret da Medusa (provider `pp_stripe_stripe`) — PAUSATO.
4. **Analytics**: `dataLayer.push({ ecommerce: null })` prima di ogni evento GA4.
5. **Regole varianti/sold-out/visibilità**: come sopra (§ Domain Model).
6. **Email conferma ordine**: subscriber `order.placed` → Resend (backend).
7. **Contact form**: invio via Resend (senza DB).

## Environment Variables

> Valori di esempio. `.env.example` è la fonte; non committare mai `.env*`.

### Storefront (Vercel)
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa.darkcardcollection.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...            # da Admin → Settings → API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...       # (per il checkout)
NEXT_PUBLIC_SITE_URL=https://darkcardcollection.com
RESEND_API_KEY=re_...   EMAIL_FROM=noreply@darkcardcollection.com   # contact form
```

### Backend (`apps/backend/.env.prod`)
```env
DATABASE_URL=postgres://…neon.tech/dcc_medusa?sslmode=require
REDIS_URL=redis://redis:6379
JWT_SECRET / COOKIE_SECRET / AUTH_MFA_ENCRYPTION_KEY (64 hex)
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
STORE_CORS / ADMIN_CORS / AUTH_CORS
RESEND_API_KEY / EMAIL_FROM
```

## File Structure (attuale)

```
src/                      # Storefront
├── app/                  # shop, products/[slug], cart, checkout, account, api/*, feed, sitemap, llms*
├── components/           # layout, product, sections, seo, ui
├── hooks/                # useCart, useAuth, useConsent
├── lib/                  # medusa/, feed/, analytics.ts, group-products, slug, product-image, proxy-image
tests/                    # Vitest storefront
apps/backend/
├── medusa-config.ts      # moduli (procurement, redis, payment-stripe) + CORS
├── docker-compose.prod.yml / Dockerfile / Caddyfile
├── src/
│   ├── modules/procurement/     # PurchaseLot/PurchaseLine, cost math, service FIFO
│   ├── workflows/               # create-purchase-lot, record-external-sale
│   ├── subscribers/             # order-placed (snapshot FIFO + email Resend)
│   ├── migration-scripts/       # seed (region IT/EUR, sales channels, location, api key)
│   └── lib/order-email.ts       # template + invio Resend
docs/                     # overview, DB, medusa (REPLATFORMING/DEPLOYMENT), sessioni, changelog
```

## Known Issues / TODO

> Unico punto per tutte le task: [`docs/project/PENDING.md`](./PENDING.md).

## Git / Changelog

- Storico in `docs/project/changelog.md`.
- Il replatforming su Medusa è completo (F0–F3 + cutover); **checkout Stripe** resta l'unico task aperto prima di riaprire le vendite.