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
CRON_SECRET=your-cron-secret
GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
DASHBOARD_GOOGLE_EMAILS=you@gmail.com,other@gmail.com
```

## File Structure (actual)

```
src/
├── app/
│   ├── (payload)/                  # Payload CMS admin (auto-generated)
│   ├── admin/
│   │   └── products/page.tsx       # /admin/products - variant management + delete
│   ├── api/
│   │   ├── admin/
│   │   │   ├── backfill-images/route.ts
│   │   │   └── products/
│   │   │       ├── route.ts        # GET list + PATCH update + DELETE variant
│   │   │       └── [id]/route.ts   # PATCH update single product + DELETE variant
│   │   ├── auth/google/
│   │   │   ├── route.ts            # GET /api/auth/google - starts OAuth flow (state nonce cookie)
│   │   │   └── callback/route.ts   # GET callback - exchanges code, verifies ID token + email whitelist, sets dcc-dash cookie
│   │   ├── contact/route.ts        # Contact form API (saves to messages collection)
│   │   ├── cron/
│   │   │   ├── import/route.ts     # Daily import from Google Sheets (3am)
│   │   │   └── prices/route.ts     # Daily price update from sales (4am)
│   │   ├── products/import/route.ts # Manual import endpoint
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
│   │   ├── actions.ts              # Server actions: products, orders, sync, SQL
│   │   ├── login.tsx               # Login screen: "Accedi con Google" (only)
│   │   └── main.tsx                # Dashboard UI: overview, products, orders, sync, SQL tabs
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
│   ├── api-auth.ts                 # API authentication helpers
│   ├── collections.ts              # Collection helpers
│   ├── dash-auth.ts                # Auth dashboard: cookie dcc-dash (HMAC), whitelist
│   ├── db-query.ts                 # Read-only SQL runner (dashboard SQL tab)
│   ├── google-sheets.ts            # Google Sheets API read/write
│   ├── group-products.ts           # Groups products by title (variants → parent)
│   ├── image-import.ts             # Download + upload images to Vercel Blob
│   ├── order-email.ts              # Template + invio email conferma ordine (Resend)
│   ├── parse-csv.ts                # RFC 4180 CSV parser (multilinea/quotes)
│   ├── payload.ts                  # getPayloadClient() - cached singleton
│   ├── product-filters.ts          # Opzioni condizione/lingua per filtri
│   ├── product-image.ts            # Helper immagine prodotto
│   ├── proxy-image.ts              # Cardmarket image proxy URL builder
│   └── stripe.ts                   # Stripe client (lazy getStripe)
├── payload/
│   ├── collections/
│   │   ├── Products/index.ts       # 20 fields (see schema below)
│   │   ├── Categories/index.ts     # name, slug, description
│   │   ├── Collections/index.ts    # name, slug, description, releaseDate
│   │   ├── Orders/index.ts         # orderId, items, status, total, stripeSessionId
│   │   ├── Users/index.ts          # email, password
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
    └── 20260807_add_unique_stripe_session.ts
```

```
tests/                            # Unit test Vitest (group-products, parse-csv, cart, product-filters, sticky-add-to-cart)
.github/workflows/ci.yml          # CI: tsc --noEmit + vitest + next build
vitest.config.ts
next.config.ts
tsconfig.json
payload.config.ts
vercel.json
package.json
.env.example
scripts/                          # at repo root (not under src/)
├── create-admin.mjs
└── import-products.ts
```

## Payload Collections Schema

### Products (key fields)
| Field | Type | Notes |
|-------|------|-------|
| title | text | required |
| slug | text | required, unique |
| itemId | text | unique, from Google Sheets |
| storePrice | number | actual selling price |
| price | number | purchase cost (default 0) |
| compareAtPrice | number | strikethrough/target price |
| status | select | listed / hold / sold |
| condition | select | mint / near-mint / lightly-played / moderately-played / heavily-played / damaged / graded |
| category | relationship → categories | |
| collection | relationship → collections | |
| language | select | italian / english / chinese / japanese |
| cardNumber | text | |
| rarity | select | common / uncommon / rare / rare-holo / ultra-rare / secret-rare |
| quantity | number | default 1 |
| image | upload → media | |
| averageSalePrice | number | auto-calculated from sales |
| lastPriceUpdate | date | |
| featured | checkbox | default false |
| isVisible | checkbox | default true, controls shop visibility independently of status |

### Payload `id` type is `string | number` - always cast with `as number` when creating orders.

## Cron Jobs (vercel.json)
- `/api/cron/import` - daily at 3am, imports from Google Sheets inventory tab
- `/api/cron/prices` - daily at 4am, calculates average sale price from sales tab
- Auth: Bearer token with `CRON_SECRET` or `PAYLOAD_SECRET`

## Google Sheets

**Inventory tab** (16 rows):
Headers: `item_id, product_name, category, language, set, condition, purchase_id, purchase_date, unitary_net_price, unitary_gross_price, product_state, hold_days, hold_end_date, target_price, expected_ROI, market_price, volatile_ROI, notes`

**Sales tab** (1 row):
Headers: `sale_id, item_id, listing_date, sale_date, platform, unitary_gross_price, platform_fee, payment_fee, shipping_fee, gross_price, sale_price, profit, real_ROI, real_hold_days`

**Import logic**: product_state=SOLD → skip; SEALED→mint, NM→near-mint, etc.; ITA→italian, ENG→english, CIN→chinese; IRL→skip

## Key Decisions

1. **Shop page route**: `/shop` directory (NOT route group `(shop)`) to avoid conflict with root `page.tsx`
2. **Cart**: localStorage via CartProvider context, not server-side
3. **Checkout**: Creates ad-hoc Stripe price_data (no Stripe Products), passes Payload product IDs in metadata
4. **Webhook**: Reads `product.metadata.payloadProductId` from Stripe to create order with correct Payload relationship
5. **Products collection**: Both LISTED and HOLD products can be shown on shop, controlled by `isVisible` field
6. **Storefront visibility filter**: `AND: [{ status: { in: ['listed', 'hold'] } }, { isVisible: { equals: true } }]` on shop page (hold products with a price stay visible)

## Variant Products Logic

Products in Google Sheets are imported as individual rows (variants). Each row becomes a Payload product with the same `title` but different `itemId`, `language`, `condition`, and `storePrice`. Variants represent the same product purchased from suppliers on different dates/orders.

- **Variants are NOT exposed to customers** - shop and PDP show only the "parent product" (grouped by `title`)
- **Stock** = sum of `quantity` across all variants with the same title
- **Selling price** = minimum `storePrice` (target_price from Sheets) across variants
- **Grouping** is done by `groupProducts()` in `src/lib/group-products.ts`
- **PDP** fetches all variants by title, groups them, and shows aggregate info (total stock, available languages/conditions as text)
- **Admin** (`/admin/products`) shows variants in expandable rows - this is the ONLY place variants are visible
- **Delete variant**: removes from Payload only, does NOT affect Google Sheets (same row stays in the sheet for import history)
- **Visibility toggle**: `isVisible` field controls whether a product group appears in the shop. Admin toggles via eye icon in `/admin/products`. Sync preserves existing visibility settings.

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

## Email

- Adapter Payload: `@payloadcms/email-resend` configurato in `payload.config.ts` solo se `RESEND_API_KEY` è presente (altrimenti log in console).
- Invio: `sendOrderConfirmationEmail` in `src/lib/order-email.ts`, chiamata dal webhook `checkout.session.completed` dopo la creazione dell'ordine. Template HTML in `buildOrderConfirmationHtml` (funzione pura, testabile).

## Git Commits

Latest: `4f4e227` (orchestrator config) - seguita dalla riorganizzazione docs (`f818ce1`) e dal cleanup codice (`1599feb`). Storico recente dettagliato in [`changelog.md`](./changelog.md).

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
