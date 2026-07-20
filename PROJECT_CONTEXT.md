# DARK CARD COLLECTION — Project Context

## Overview

E-commerce Pokémon TCG sealed products. Next.js 15 + Payload CMS 3.86 + PostgreSQL (Neon.io) + Stripe + Vercel.

- **Live URL**: https://darkcardcollection.com
- **Admin**: https://darkcardcollection.com/admin
- **GitHub**: https://github.com/patternlover/dark-card-collection

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Next.js 15.4.11 (App Router) |
| CMS | Payload CMS 3.86.0 |
| Database | PostgreSQL via Neon.io |
| Payments | Stripe |
| Styling | Tailwind CSS 4 |
| Hosting | Vercel |
| Storage | Vercel Blob Storage |

## Environment Variables

```env
DATABASE_URI=postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?sslmode=require
PAYLOAD_SECRET=442145e4b83f1b07d85efd0a068ba673c05f41d0de582f1f5f664a95745cdd55
NEXT_PUBLIC_SITE_URL=https://darkcardcollection.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
CRON_SECRET=your-cron-secret
```

## File Structure (actual)

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (CartProvider, Header, Footer)
│   ├── page.tsx                    # Homepage (force-dynamic, fetches from Payload)
│   ├── not-found.tsx               # 404 page
│   ├── error.tsx                   # Error boundary
│   ├── globals.css
│   │
│   ├── shop/
│   │   ├── page.tsx                # /shop — product listing with filters + search
│   │   ├── bestsellers/page.tsx    # /shop/bestsellers — featured products
│   │   ├── new-arrivals/page.tsx   # /shop/new-arrivals — newest products
│   │   ├── preorders/page.tsx      # /shop/preorders — hold status products
│   │   └── collections/page.tsx    # /shop/collections — collection list from Payload
│   │
│   ├── products/
│   │   └── [slug]/page.tsx         # Product detail page
│   │
│   ├── cart/page.tsx               # Cart page (client, uses CartProvider)
│   ├── checkout/
│   │   ├── page.tsx                # Checkout (client, sends to Stripe)
│   │   └── success/page.tsx        # Post-payment success
│   │
│   ├── info/
│   │   ├── about/page.tsx          # About page
│   │   ├── faq/page.tsx            # FAQ (client, accordion)
│   │   └── contact/page.tsx        # Contact form (client)
│   │
│   ├── api/
│   │   ├── admin/
│   │   │   ├── products/
│   │   │   │   ├── route.ts       # GET list products + PATCH update + DELETE variant
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # PATCH update single product + DELETE variant (no Sheets)
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts   # Creates Stripe checkout session
│   │   │   └── webhook/route.ts    # Stripe webhook (checkout.session.completed)
│   │   ├── contact/route.ts        # Contact form API (saves to messages collection)
│   │   ├── cron/
│   │   │   ├── import/route.ts     # Daily import from Google Sheets (3am)
│   │   │   └── prices/route.ts     # Daily price update from sales (4am)
│   │   └── products/
│   │       └── import/route.ts     # Manual import endpoint
│   │
│   ├── admin/
│   │   ├── products/
│   │   │   └── page.tsx            # /admin/products — variant management + delete
│   │   └── sync/
│   │       ├── page.tsx            # /admin/sync — Google Sheets sync UI
│   │       └── actions.ts          # Server action for sync
│   │
│   ├── dashboard/
│   │   └── page.tsx                # /dashboard — admin hub (password auth)
│   │
│   └── (payload)/                  # Payload admin (auto-generated)
│
├── components/
│   ├── admin/
│   │   ├── EditProductModal.tsx    # Modal for editing a single product variant
│   │   └── ProductGroupRow.tsx     # Expandable table row with delete for admin
│   ├── layout/
│   │   ├── Header.tsx              # Sticky header with nav + cart badge
│   │   ├── Footer.tsx              # Footer with cleaned links
│   │   └── MobileMenu.tsx          # Mobile hamburger menu
│   ├── product/
│   │   ├── ProductCard.tsx         # Product card (links to /products/[slug])
│   │   ├── ProductGroupCard.tsx    # Grouped card in shop (links to PDP, no variants)
│   │   ├── ProductGallery.tsx      # Image gallery with thumbnails
│   │   ├── ProductFilters.tsx      # Reusable filter component (unused in shop)
│   │   └── AddToCartButton.tsx     # Add to cart with feedback
│   ├── sections/
│   │   ├── HeroSection.tsx         # Homepage hero
│   │   ├── FeaturedProducts.tsx    # Async server component, fetches from Payload
│   │   └── TrustBadges.tsx         # Trust badges
│   └── ui/
│       ├── Badge.tsx               # Status/condition badge
│       └── CookieConsent.tsx       # GDPR cookie consent banner
│
├── hooks/
│   └── useCart.tsx                  # CartProvider + useCart (localStorage)
│
├── lib/
│   ├── payload.ts                   # getPayloadClient() — cached singleton
│   ├── stripe.ts                    # Stripe client
│   ├── group-products.ts            # Groups products by title (variants → parent)
│   ├── google-sheets.ts             # Google Sheets API read/write
│   ├── image-import.ts              # Download + upload images to Vercel Blob
│   ├── parse-csv.ts                 # RFC 4180 CSV parser
│   ├── proxy-image.ts               # Cardmarket image proxy URL builder
│   └── analytics.ts                 # GA4 ecommerce dataLayer events
│
├── payload/
│   ├── collections/
│   │   ├── Products/index.ts       # 19 fields (see schema below)
│   │   ├── Categories/index.ts     # name, slug, description
│   │   ├── Collections/index.ts    # name, slug, description, releaseDate
│   │   ├── Orders/index.ts         # orderId, items, status, total, stripeSessionId
│   │   ├── Users/index.ts          # email, password
│   │   ├── Media/index.ts          # upload field
│   │   └── Messages/index.ts       # name, email, subject, message, read, replied
│   └── globals/
│       ├── SiteSettings/index.ts   # siteName, description
│       └── Header/index.ts         # navItems (links array)
│
└── scripts/
    └── import-products.ts          # Google Sheets → Payload import
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

### Payload `id` type is `string | number` — always cast with `as number` when creating orders.

## Cron Jobs (vercel.json)
- `/api/cron/import` — daily at 3am, imports from Google Sheets inventory tab
- `/api/cron/prices` — daily at 4am, calculates average sale price from sales tab
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
5. **Products collection**: Both LISTED and HOLD products shown on shop (HOLD with "In Attesa" badge)
6. **Storefront visibility filter**: `status: { equals: 'listed' }` on shop page

## Variant Products Logic

Products in Google Sheets are imported as individual rows (variants). Each row becomes a Payload product with the same `title` but different `itemId`, `language`, `condition`, and `storePrice`. Variants represent the same product purchased from suppliers on different dates/orders.

- **Variants are NOT exposed to customers** — shop and PDP show only the "parent product" (grouped by `title`)
- **Stock** = sum of `quantity` across all variants with the same title
- **Selling price** = minimum `storePrice` (target_price from Sheets) across variants
- **Grouping** is done by `groupProducts()` in `src/lib/group-products.ts`
- **PDP** fetches all variants by title, groups them, and shows aggregate info (total stock, available languages/conditions as text)
- **Admin** (`/admin/products`) shows variants in expandable rows — this is the ONLY place variants are visible
- **Delete variant**: removes from Payload only, does NOT affect Google Sheets (same row stays in the sheet for import history)

## Known Issues / TODO

1. No user accounts / order history
2. No email notifications
3. No cart drawer/mini-cart
4. No robots.txt / sitemap
5. No middleware for route protection
6. No tests
7. `pnpm build` and `pnpm exec tsc --noEmit` time out on WSL
8. `pnpm generate:types` times out on WSL — `payload-types.ts` never generated
9. Stripe Products not synced with Payload products

## Git Commits

Latest: `fbc33b7` (all on `origin/main`)

## Build Process

The build command runs Payload migrations before building Next.js:
```
payload generate:db-schema && payload migrate && next build
```

This ensures DB schema is always in sync with Payload config on every deploy.
