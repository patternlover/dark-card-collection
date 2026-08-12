# DARK CARD COLLECTION - Project Context

## Overview

E-commerce Pokémon TCG sealed products. Next.js 16.3.0 + Payload CMS 3.87.1 + PostgreSQL (Neon.io) + Stripe + Vercel.

- **Live URL**: https://darkcardcollection.com
- **Admin**: https://darkcardcollection.com/admin
- **GitHub**: https://github.com/patternlover/dark-card-collection

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Next.js 16.3.0 (App Router) |
| CMS | Payload CMS 3.87.1 |
| Database | PostgreSQL via Neon.io |
| Payments | Stripe (live mode) |
| Email | Resend (`@payloadcms/email-resend`) |
| Styling | Tailwind CSS 4 |
| Hosting | Vercel |
| Storage | Vercel Blob Storage |
| Tests/CI | Vitest + GitHub Actions |

## Environment Variables

> Valori di esempio. I nomi ufficiali delle variabili sono in [`.env.example`](../../.env.example).

```env
DATABASE_URI=postgresql://user:password@host.neon.tech/dbname?sslmode=require
PAYLOAD_SECRET=your-32-char-random-secret
NEXT_PUBLIC_SITE_URL=https://your-site.com
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
BLOB_READ_WRITE_TOKEN=vercel_blob_your_token_here
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@your-site.com
DASH_SESSION_SECRET=your-dash-session-secret
GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
DASHBOARD_GOOGLE_EMAILS=you@gmail.com,other@gmail.com
```

## File Structure (actual)

```
src/
├── app/
│   ├── (payload)/                  # Payload CMS admin (auto-generated)
│   ├── api/
│   │   ├── auth/google/
│   │   │   ├── route.ts            # GET /api/auth/google - starts OAuth flow (state nonce cookie)
│   │   │   └── callback/route.ts   # GET callback - exchanges code, verifies ID token + email whitelist, sets dcc-dash cookie
│   │   ├── contact/route.ts        # Contact form API (saves to messages collection)
│   │   ├── proxy-image/route.ts    # Cardmarket image proxy
│   │   └── stripe/
│   │       ├── checkout/route.ts   # Creates Stripe checkout session
│   │       ├── order/route.ts      # Order creation endpoint
│   │       └── webhook/route.ts    # Stripe webhook (checkout.session.completed) + order confirmation email
│   ├── cart/
│   │   ├── page.tsx                # Cart page (client, uses CartProvider)
│   │   └── loading.tsx
│   ├── checkout/
│   │   ├── page.tsx                # Checkout (client, Stripe Embedded Checkout)
│   │   ├── loading.tsx
│   │   └── success/page.tsx        # Post-payment success
│   ├── dashboard/
│   │   ├── page.tsx                # /dashboard - admin hub (Google OAuth auth, whitelist)
│   │   ├── actions.ts              # Server actions: products, orders, SQL
│   │   ├── login.tsx               # Login screen: "Accedi con Google" (only)
│   │   ├── main.tsx                # Dashboard UI: overview, products, orders, SQL tabs
│   │   └── acquisti/               # /dashboard/acquisti - lot entry (post-dates this tree: verify structure; rename → purchases)
│   ├── guide/
│   │   ├── page.tsx                # /guide - guide index
│   │   ├── loading.tsx
│   │   ├── come-scegliere-booster-box/page.tsx
│   │   ├── dove-comprare-carte-pokemon-originali/page.tsx
│   │   └── etb-cosa-sono-elite-trainer-box/page.tsx
│   ├── info/
│   │   ├── about/page.tsx          # About page (max-w-2xl)
│   │   ├── contact/page.tsx        # Contact form (client) (max-w-2xl)
│   │   ├── faq/page.tsx            # FAQ (client, accordion) (max-w-2xl)
│   │   ├── privacy/page.tsx
│   │   ├── shipping-returns/page.tsx
│   │   ├── terms/page.tsx
│   │   └── loading.tsx
│   ├── products/
│   │   ├── [slug]/page.tsx         # Product detail page
│   │   └── loading.tsx
│   ├── shop/
│   │   ├── page.tsx                # /shop - product listing with filters + search
│   │   ├── loading.tsx
│   │   ├── bestsellers/page.tsx    # /shop/bestsellers - featured products
│   │   ├── new-arrivals/page.tsx   # /shop/new-arrivals - newest products
│   │   ├── preorders/page.tsx      # /shop/preorders - hold status products
│   │   ├── collections/
│   │   │   ├── page.tsx            # /shop/collections - collection list from Payload
│   │   │   └── [slug]/page.tsx     # /shop/collections/[slug]
│   │   └── categories/
│   │       └── [slug]/page.tsx     # /shop/categories/[slug]
│   ├── error.tsx                   # Error boundary
│   ├── global-error.tsx            # Global error boundary
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx                  # Root layout (RouteProgress, ConsentModeScript, providers)
│   ├── manifest.ts
│   ├── not-found.tsx               # 404 page
│   ├── page.tsx                    # Homepage (force-dynamic, fetches from Payload)
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── llms.txt
│   ├── llms-full.txt
│   ├── .well-known/
│   └── security.txt/
├── components/
│   ├── admin/
│   │   ├── EditProductModal.tsx    # Modal for editing a single product variant
│   │   └── ProductGroupRow.tsx     # Expandable table row with delete for admin
│   ├── contact/
│   │   └── ContactForm.tsx         # Contact form component
│   ├── layout/
│   │   ├── AnalyticsProvider.tsx   # GA4
│   │   ├── ConsentModeScript.tsx   # Google Consent Mode v2
│   │   ├── Footer.tsx              # Footer with cleaned links
│   │   ├── Header.tsx              # Sticky header (offset --banner-h) + cart badge
│   │   ├── LayoutShell.tsx         # Client wrapper: banner fisso, Header/Footer condizionali
│   │   └── MobileMenu.tsx          # Mobile hamburger menu
│   ├── product/
│   │   ├── AddToCartButton.tsx     # Add to cart with feedback
│   │   ├── ProductCard.tsx         # Product card (links to /products/[slug])
│   │   ├── ProductFilters.tsx      # Reusable filter component
│   │   ├── ProductGallery.tsx      # Image gallery with thumbnails
│   │   ├── ProductGroupCard.tsx    # Grouped card in shop (links to PDP, no variants)
│   │   ├── ProductImage.tsx        # Product image helper
│   │   ├── QuickAddButton.tsx      # Cart icon button on cards (client, instant add)
│   │   └── StickyAddToCart.tsx     # Sticky ATC in PDP, si solleva quando il footer è visibile
│   ├── sections/
│   │   ├── CartSocialProof.tsx     # Social proof bar on cart
│   │   ├── ClientListing.tsx       # PLP client: filtri sticky, ricerca, dedup titolo, griglia
│   │   ├── CollectionsShowcase.tsx # Collections showcase section
│   │   ├── CtaBanner.tsx           # CTA banner section
│   │   ├── FeaturedProducts.tsx    # Async server component, fetches from Payload
│   │   ├── FreeShippingBanner.tsx  # Banda "spedizione gratuita dagli 80€" fissa sopra navbar
│   │   ├── HeroBackground.tsx      # Oggetti decorativi con parallasse scroll (data-x/y)
│   │   ├── HeroSection.tsx         # Homepage hero
│   │   ├── ListingShell.tsx        # Wrapper PLP (Suspense + padding)
│   │   └── TrustBadges.tsx         # Trust badges
│   ├── seo/
│   │   └── JsonLd.tsx              # JSON-LD structured data
│   └── ui/
│       ├── Badge.tsx               # Status/condition badge
│       ├── Breadcrumb.tsx          # Breadcrumb navigation
│       ├── ConfettiBurst.tsx       # Effetto confetti al click su ATC
│       ├── CookieConsent.tsx       # GDPR cookie consent banner
│       ├── ListingSkeleton.tsx     # Skeleton loader for listings
│       ├── LoadingFallback.tsx     # Fallback Suspense caricamento
│       ├── Reveal.tsx              # Reveal animation wrapper
│       └── RouteProgress.tsx       # Barra di caricamento fluida (rAF)
├── hooks/
│   ├── useCart.tsx                 # CartProvider + useCart (localStorage)
│   └── useConsent.tsx              # Consent management hook
├── lib/
│   ├── analytics.ts                # GA4 ecommerce dataLayer events
│   ├── collections.ts              # Collection helpers
│   ├── dash-auth.ts                # Auth dashboard: cookie dcc-dash (HMAC), whitelist
│   ├── db-query.ts                 # Read-only SQL runner (dashboard SQL tab)
│   ├── group-products.ts           # Groups products by title (variants → parent)
│   ├── order-email.ts              # Template + invio email conferma ordine (Resend)
│   ├── payload.ts                  # getPayloadClient() - cached singleton
│   ├── product-filters.ts          # Opzioni condizione/lingua per filtri
│   ├── product-image.ts            # Helper immagine prodotto
│   ├── proxy-image.ts              # Cardmarket image proxy URL builder
│   ├── slug.ts                     # Slugify helper (dashboard + PDP)
│   └── stripe.ts                   # Stripe client (lazy getStripe)
├── payload/
│   ├── collections/
│   │   ├── Products/index.ts       # 22 fields (see schema below)
│   │   ├── Categories/index.ts     # name, slug, description
│   │   ├── Collections/index.ts    # name, slug, description, releaseDate
│   │   ├── Orders/index.ts         # transaction_id, items, status, value, stripe_session_id (+ target: sales_channel, items unit_cost_snapshot)
│   │   ├── Media/index.ts          # upload field
│   │   └── Messages/index.ts       # name, email, subject, message, read, replied
│   └── globals/
│       ├── SiteSettings/index.ts   # siteName, description
│       └── Header/index.ts         # navItems (links array)
└── migrations/
    ├── index.ts
    ├── 20260719_131233.ts
    ├── 20260719_131233.json
    ├── 20260719_add_image_url.ts
    ├── 20260719_add_product_state.ts
    ├── 20260720_add_is_visible.ts
    ├── 20260802_202035.ts
    ├── 20260802_202035.json
    ├── 20260807_add_unique_stripe_session.ts
    └── 20260809_google_schema.ts
└── ... (nuove migration generate da `pnpm build`)
```

```
tests/                            # Unit test Vitest (group-products, slug, cart, product-filters, sticky-add-to-cart)
.github/workflows/ci.yml          # CI: tsc --noEmit + vitest + next build
vitest.config.ts
next.config.ts
tsconfig.json
payload.config.ts
vercel.json
package.json
.env.example
scripts/                          # at repo root (not under src/)
└── backfill-google-schema.ts     # backfill item_group_id/availability + dedup righe duplicate
```

## Payload Collections Schema

### Products (key fields)
| Field | Type | Notes |
|-------|------|-------|
| title | text | required |
| slug | text | required, unique |
| item_group_id | text | Google Merchant item_group_id: slug del titolo (varianti stesso prodotto) |
| price | number | actual selling price (Merchant price) |
| sale_price | number | strikethrough/compare price (Merchant sale_price) |
| cost_of_goods_sold | number | purchase cost (Merchant cost_of_goods_sold) |
| availability | select | in_stock / out_of_stock / preorder / backorder (Merchant availability) |
| status | select | listed / hold / sold |
| condition | select | new / refurbished / used (Merchant condition) |
| grade | select | mint / near-mint / lightly-played / moderately-played / heavily-played / damaged / graded |
| category | relationship → categories | |
| collection | relationship → collections | |
| product_type | text | Merchant product_type |
| google_product_category | text | Merchant google_product_category (ID o percorso tassonomia) |
| language | select | italian / english / chinese / japanese |
| card_number | text | |
| rarity | select | common / uncommon / rare / rare-holo / ultra-rare / secret-rare |
| quantity | number | default 1 |
| image_link | text | URL esterno (Cardmarket), fallback rispetto a images[] |
| images | array → media | immagini ufficiali su Vercel Blob |
| average_sale_price | number | auto-calculated from sales |
| last_price_update | date | |
| featured | checkbox | default false |
| is_visible | checkbox | default true, controls shop visibility independently of status |

### Payload `id` type is `string | number` - always cast with `as number` when creating orders.

## Key Decisions

1. **Shop page route**: `/shop` directory (NOT route group `(shop)`) to avoid conflict with root `page.tsx`
2. **Cart**: localStorage via CartProvider context, not server-side
3. **Checkout**: Creates ad-hoc Stripe price_data (no Stripe Products), passes Payload product IDs in metadata
4. **Webhook**: Reads `product.metadata.payloadProductId` from Stripe to create order with correct Payload relationship
5. **Products collection**: Both LISTED and HOLD products can be shown on shop, controlled by `is_visible` field
6. **Storefront visibility filter**: `AND: [{ status: { in: ['listed', 'hold', 'sold'] } }, { is_visible: { equals: true } }]` on shop page — `hold` = preorder, `sold` renders as "Esaurito" (not purchasable); `is_visible: false` is the only hide switch
7. **Language policy**: ALL code in English (identifiers, DB fields, routes, comments, commits). AI chat output, session plans and changelogs in Italian. Customer-facing storefront copy in Italian.
8. **Inventory model**: we buy in lots and sell single units — the Purchases collection tracks lots and costs; variants exist only for buyer-visible differences (see "Domain Model & Inventory Flow")
9. **Dashboard nomenclature**: sections are Lotti / Magazzino / Listino / Ordini / Messaggi (Italian UI labels) mapped to purchases / inventory / listings / orders / messages in code — see "Dashboard sections & naming"
10. **Sold-out policy**: any sale (Stripe or external) decrements stock; stock 0 → the system auto-sets `status: sold` + `availability: out_of_stock`; product stays visible as "Esaurito" with add-to-cart disabled; checkout validates quantity ≤ stock server-side; restock auto-restores `listed` + `in_stock`; hiding is only `is_visible: false`
11. **Extra costs**: lot `extra_costs` allocated pro-rata by line value → `effective_unit_cost = unit_cost × (1 + extra_costs/subtotal)`; all cost math uses `effective_unit_cost` (see "Extra costs allocation")
12. **Sales channels**: Orders carry `sales_channel` (`website` default via Stripe webhook | `vinted` | `ebay` | `cardmarket` | `other`); external sales are recorded manually from Ordini through the same `recordSale` pipeline (order + stock + FIFO + cost snapshot); external orders are never pushed to GA4

## Domain Model & Inventory Flow

> **STATUS**: target model (decided 2026-08-12). It REPLACES the deprecated "variant per purchase batch" logic — see Migration at the end. Read this section before touching Products, Purchases, or the dashboard.

**Golden rule**: a *variant* exists ONLY when the buyer sees or chooses a difference (grade, condition, language, edition). Purchase-side differences — cost, place, date, batch — NEVER create a variant or a duplicate Product: they belong to Purchases.

### Glossary
- **Product** = one sellable catalog item (one row). Physically identical sealed items = ONE Product with stock in `quantity`, no matter how many batches they were bought in.
- **Variant** = a Product sharing `title` with others but differing by a buyer-visible attribute (grade / condition / language). Grouped by `groupProducts()` in `src/lib/group-products.ts`; shop and PDP show only the parent, the dashboard shows expandable groups. Not used today (sealed only); WILL be used for graded singles/slabs (each slab = its own Product, `quantity: 1`).
- **Purchase (lotto)** = one buying event: date, source, costs. We buy in lots and sell single units.
- **Purchase line** = product + quantity + unit cost inside a lot. This is where "price and place of purchase" live.
- **Stock** = `Products.quantity`: incremented by purchase lines, decremented by orders.
- **Listing** = making a Product sellable on the storefront: `price` + `status` (`listed`/`hold`) + `is_visible`.

### Canonical example
We buy 10x "Bundle Paldea Evolved": 6 @ €25.00 at a supermarket + 4 @ €22.00 at a newsstand.
→ ONE Product, stock 10, ONE Purchase with two lines (or two Purchases with one line each).
→ NOT two Products, NOT two variants. The customer sees a single listing.

### Purchases collection (to create)
| Field | Type | Notes |
|-------|------|-------|
| purchase_date | date | required |
| source_type | select | newsstand / supermarket / shop / online / private / other |
| source_name | text | e.g. "Esselunga Viale X", "edicola Piazza Y" |
| extra_costs | number | shipping/fees on the whole lot, optional — allocated pro-rata by line value (see below) |
| notes | textarea | |
| lines | array | `product` (rel → products), `quantity`, `unit_cost`, `effective_unit_cost` (derived — see below), `remaining_quantity` (init = quantity, consumed FIFO by sales) |
| total_cost | number | derived: Σ qty × unit_cost + extra_costs |

Payload stores the `lines` array in its own Postgres table (`purchases_lines`) → directly queryable from the dashboard SQL tab.

### Extra costs allocation
`extra_costs` (shipping, fees) are spread across lines proportionally to line value, which reduces to a uniform multiplier:

`effective_unit_cost = unit_cost × (1 + extra_costs / subtotal)`, where `subtotal = Σ (quantity × unit_cost)`.

Edge case: if subtotal is 0 (e.g. gifted lot with shipping only), split equally per unit: `effective_unit_cost = extra_costs / Σ quantity`. Computed server-side on purchase create/update and stored on the line. ALL cost math — product average cost, FIFO consumption, order snapshots, margins — uses `effective_unit_cost`, never raw `unit_cost`.

### Products: semantic changes
- `quantity` = real stock of the sellable item (no longer "batch size").
- `cost_of_goods_sold` = DERIVED weighted average of its purchase lines' `effective_unit_cost` (kept in sync for Google Merchant); never hand-edited once Purchases exists.
- `item_group_id` unchanged (= title slug); becomes meaningful again when real variants arrive.
- Creating a second Product with an existing `title` is allowed ONLY if a buyer-visible attribute differs — the dashboard should warn otherwise.
- `status` lifecycle: `listed`/`hold` while on sale ↔ `sold` (set AUTOMATICALLY when stock reaches 0 by any sale channel; automatically back to `listed` when a purchase restores stock). Hiding a product is ONLY `is_visible: false`.

### Dashboard sections & naming
UI labels are Italian, code names English (see language policy). Sections may be tabs or routes; today they live as tabs in `main.tsx` plus the `/dashboard/acquisti` route — routes below are the target.

| UI label (it) | Code name | Route (target) | Operates on |
|---------------|-----------|----------------|-------------|
| Lotti | purchases | /dashboard/purchases | purchases (+ lines) |
| Magazzino | inventory | /dashboard/inventory | products — create, stock, avg cost, purchase history |
| Listino | listings | /dashboard/listings | products — price, sale_price, status, is_visible, featured |
| Ordini | orders | /dashboard/orders | orders (+ margin from cost snapshots) |
| Messaggi | messages | /dashboard/messages | messages (contact form) |

Magazzino and Listino are two views over the SAME `products` collection (procurement-facing vs storefront-facing) — never duplicate product data to separate them.

### Flow
1. **Purchase ("Lotti")** — `/dashboard/purchases` (rename of current `/dashboard/acquisti`): lot header + lines (pick an existing Product or quick-create a draft one). Saving increments each product's stock and recomputes its average cost.
2. **Warehouse ("Magazzino")** — per Product: stock, average cost, inventory value, drill-down into purchase history. New products are created here (full anagrafica) or via quick-create from Lotti.
3. **Listing ("Listino")** — set `price`, `status: listed` (or `hold` for preorders), `is_visible: true`; storefront filter becomes `status in [listed, hold, sold] AND is_visible` (`sold` renders as sold out; `is_visible: false` is the ONLY way to hide a product). Stock 0 → the system automatically sets `status: sold` + `availability: out_of_stock`; the product STAYS visible with an "Esaurito" badge and add-to-cart disabled (ProductCard, PDP, QuickAdd, sticky ATC). The checkout API must validate requested quantity ≤ stock server-side. A new purchase line that brings stock back above 0 automatically restores `status: listed` + `availability: in_stock`.
4. **Sale ("Ordini")** — two channels, ONE shared pipeline (`recordSale`): (a) the Stripe webhook (`sales_channel: website`); (b) a manual "Registra vendita esterna" action in Ordini for sales made on other platforms (`sales_channel: vinted | ebay | cardmarket | other`; `value` = amount actually received; `stripe_session_id` empty). Both create the Order, decrement stock, consume `remaining_quantity` FIFO (oldest lines first), snapshot the consumed `effective_unit_cost` on the order item, and auto-set `status: sold` when stock hits 0 → exact landed margin per sale on every channel, sell-through per lot. External-channel orders are business data only — NEVER pushed to GA4 (site analytics tracks the website channel).
5. **Cost analytics** — by source / lot / product from `purchases_lines` + order cost snapshots (best sources, lots still in stock, margins).

### Migration from the deprecated model
Same-title Product rows that differ only by cost/qty (fake variants):
1. keep one row per truly distinct sellable item and sum quantities;
2. for each merged row create a retroactive Purchase (`purchase_date` = row `createdAt`, `source_name: "legacy"`) with one line (qty, `unit_cost` = old `cost_of_goods_sold`);
3. delete the merged duplicates; verify grouping, PDP, sitemap and Merchant feed are unaffected;
4. legacy rows already marked `sold`: fold them into the merge where they duplicate a surviving item, otherwise set `is_visible: false` — the new storefront filter includes `sold`, so unguarded legacy rows would resurface as "Esaurito".
Rows with genuine buyer-visible differences (language/grade), if any, stay separate: those are legitimate variants.

## Known Issues / TODO

1. No user accounts / order history
2. No cart drawer/mini-cart
3. No middleware for route protection
4. No tests for pages/components (only lib unit tests)
5. `pnpm build` and `pnpm exec tsc --noEmit` time out on WSL - workaround for build: `NODE_OPTIONS="--max-old-space-size=6144" pnpm build` (the Next type-check phase OOMs with the default heap)
6. `pnpm generate:types` times out on WSL - `payload-types.ts` never generated
7. Stripe Products not synced with Payload products
8. Footer: business data (BUSINESS in `Footer.tsx`) and `CONTACT_EMAIL` still placeholders - required by law and by Stripe before go-live
9. Email conferma ordine: senza `RESEND_API_KEY` l'email non parte (l'ordine viene comunque creato)
10. Deprecated "variant per purchase batch" data still in DB — needs the migration described in "Domain Model & Inventory Flow"

## Email

- Adapter Payload: `@payloadcms/email-resend` configurato in `payload.config.ts` solo se `RESEND_API_KEY` è presente (altrimenti log in console).
- Invio: `sendOrderConfirmationEmail` in `src/lib/order-email.ts`, chiamata dal webhook `checkout.session.completed` dopo la creazione dell'ordine. Template HTML in `buildOrderConfirmationHtml` (funzione pura, testabile).

## Git Commits

Latest: `f30618e` (dashboard prodotti raggruppati + PLP card canonica) — seguita dalla rimozione del sistema legacy Google Sheets (import/cron/admin). Storico recente dettagliato in [`changelog.md`](./changelog.md).

## Footer / Design

- Footer: **all-black** (`bg-black`, `border-t-2 border-zinc-700`), full width, columns Brand / Shop / Informazioni.
- Legal links (Privacy, Termini, Spedizioni e Resi, Contatti) live only in the footer bottom bar (no "Legale" column).
- Yellow accent `#FACC15` is used only on brand/UI elements (hover, logo "COLLECTION"), not as a footer background.

## Build Process

The build command runs Payload migrations before building Next.js:
```
payload generate:db-schema && payload migrate && next build
```

This ensures DB schema is always in sync with Payload config on every deploy.
