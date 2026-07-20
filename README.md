# Dark Card Collection

Pokemon TCG e-commerce store for sealed products, single cards, and graded slabs.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: Payload CMS 3.86.0
- **Database**: PostgreSQL (Neon Serverless)
- **Payments**: Stripe (Checkout + Webhooks)
- **Storage**: Vercel Blob
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript

## Features

- Product catalog with categories and collections
- Products grouped by name (variants hidden from customers)
- Google Sheets integration for inventory management
- Stripe Checkout for secure payments
- Admin dashboard at `/dashboard` with product management and sync tools
- Responsive design with mobile menu
- Product filtering by condition, language, category, collection
- Product detail page with stock info and variant availability
- Variant management with edit and delete (Payload-only, no Sheets impact)
- Product visibility toggle (`isVisible`) — control which products appear in the shop independently of status
- Daily cron jobs for import and price updates
- GA4 ecommerce tracking via GTM

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URI=postgresql://...
PAYLOAD_SECRET=your-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
CRON_SECRET=your-cron-secret
SYNC_PASSWORD=your-admin-password
GOOGLE_SERVICE_ACCOUNT=...
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront.
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the admin dashboard.

## Google Sheets Import

Products are imported from a Google Sheets document with an `inventory` tab.

### Sheet Structure

| Column | Description |
|--------|-------------|
| `item_id` | Unique identifier (e.g. PUR-0001-01) |
| `product_name` | Product title |
| `category` | ETB, Collection, SPC, Tin, etc. |
| `language` | ITA, ENG, CIN |
| `set` | Card set name |
| `condition` | SEALED, NM, EXC, GD, LP, PL, PSA, BGS |
| `product_state` | LISTED, HOLD, SOLD |
| `target_price` | Target selling price (mapped to `storePrice`) |
| `unitary_gross_price` | Purchase cost |
| `store_price` | Strikethrough price (mapped to `compareAtPrice`) |

### Import via Script

```bash
pnpm payload run import-products
```

### Import via API

```bash
curl -X POST https://your-site.vercel.app/api/products/import \
  -H "Authorization: Bearer YOUR_PAYLOAD_SECRET"
```

## Admin

Access the admin dashboard at `/dashboard` (password-protected).

- **Gestione Prodotti** (`/admin/products`): View, edit, and delete product variants. Products are grouped by name; expand a group to see individual variants with language, condition, price, and stock.
- **Sincronizzazione** (`/admin/sync`): Trigger a manual sync from Google Sheets with import filters.
- **Payload CMS** (`/admin/[[...segments]]`): Native Payload admin panel.

### Variant Management

- Products from Google Sheets are imported as variants (same title, different `itemId`)
- Variants are only visible in `/admin/products` — the storefront shows grouped parent products
- Stock = sum of all variant quantities
- Selling price = lowest `storePrice` across variants
- Deleting a variant removes it from Payload only; the Google Sheet row is preserved

### Product Visibility

- Each product has an `isVisible` field (default: `true`)
- Toggle visibility per product group in `/admin/products` using the eye icon
- Products with `isVisible: false` are hidden from the shop regardless of status
- New products imported from Google Sheets default to `isVisible: true`
- Re-syncing from Google Sheets preserves your visibility settings

## Project Structure

```
src/
├── app/
│   ├── (payload)/              # Payload CMS admin
│   ├── admin/
│   │   ├── products/page.tsx   # Variant management + delete
│   │   └── sync/               # Google Sheets sync UI
│   ├── dashboard/
│   │   └── page.tsx            # Admin dashboard hub
│   ├── shop/                   # Product listing with filters
│   ├── products/[slug]/        # Product detail page (parent only)
│   ├── cart/                   # Shopping cart
│   ├── checkout/               # Stripe checkout
│   └── api/                    # API routes
├── components/
│   ├── admin/                  # EditProductModal, ProductGroupRow
│   ├── layout/                 # Header, Footer, MobileMenu
│   ├── product/                # ProductCard, ProductGroupCard, AddToCartButton
│   ├── sections/               # Hero, FeaturedProducts, TrustBadges
│   └── ui/                     # Badge, CookieConsent
├── lib/
│   ├── group-products.ts       # Groups variants by title
│   ├── google-sheets.ts        # Google Sheets API
│   ├── image-import.ts         # Image download + upload
│   ├── proxy-image.ts          # Cardmarket image proxy
│   ├── analytics.ts            # GA4 ecommerce events
│   ├── payload.ts              # Cached Payload client
│   └── stripe.ts               # Stripe client
└── payload/
    ├── collections/            # Products, Categories, Collections, Orders, Users, Media, Messages
    └── globals/                # SiteSettings, Header
```

## Deployment

This project is configured for Vercel deployment with automatic Payload migrations on build.

```bash
vercel --prod
```

### Cron Jobs

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/cron/import` | Daily 3:00 AM | Import products from Google Sheets |
| `/api/cron/prices` | Daily 4:00 AM | Update average sale prices |

## License

Private
