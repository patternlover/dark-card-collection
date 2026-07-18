# DARK CARD COLLECTION — Project Context

## Overview

E-commerce Pokémon TCG sealed products. Next.js 15 + Payload CMS 3.86 + PostgreSQL (Neon.io) + Stripe + Vercel.

- **Live URL**: https://dark-card-collection.vercel.app
- **Admin**: https://dark-card-collection.vercel.app/admin
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
NEXT_PUBLIC_SITE_URL=https://dark-card-collection.vercel.app
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
│   └── (payload)/                  # Payload admin (auto-generated)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # Sticky header with nav + cart badge
│   │   ├── Footer.tsx              # Footer with cleaned links
│   │   └── MobileMenu.tsx          # Mobile hamburger menu
│   ├── product/
│   │   ├── ProductCard.tsx         # Product card (Payload types)
│   │   └── AddToCartButton.tsx     # Add to cart with feedback
│   ├── sections/
│   │   ├── HeroSection.tsx         # Homepage hero
│   │   ├── FeaturedProducts.tsx    # Async server component, fetches from Payload
│   │   └── TrustBadges.tsx         # Trust badges
│   └── ui/
│       └── Badge.tsx               # Status/condition badge
│
├── hooks/
│   └── useCart.tsx                  # CartProvider + useCart (localStorage)
│
├── lib/
│   ├── payload.ts                   # getPayloadClient() — cached singleton
│   └── stripe.ts                    # Stripe client
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

## Known Issues / TODO

1. No Payload admin customization (default look)
2. No user accounts / order history
3. No email notifications
4. No cart drawer/mini-cart
5. No robots.txt / sitemap
6. No middleware for route protection
7. No tests
8. `pnpm build` and `pnpm exec tsc --noEmit` time out on WSL
9. `pnpm generate:types` times out on WSL — `payload-types.ts` never generated
10. Stripe Products not synced with Payload products

## Git Commits

Latest: `fbc33b7` (all on `origin/main`)

## Build Process

The build command runs Payload migrations before building Next.js:
```
payload generate:db-schema && payload migrate:create --force-accept-warning && payload migrate && next build
```

This ensures DB schema is always in sync with Payload config on every deploy.
