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
- Google Sheets integration for inventory management
- Stripe Checkout for secure payments
- Admin panel at `/admin`
- Responsive design with mobile menu
- Product filtering by condition, language, category

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
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

### Build

```bash
pnpm build
pnpm start
```

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
| `target_price` | Target selling price |
| `unitary_gross_price` | Purchase cost |
| `store_price` | Actual store price (optional) |

### Import via Script

```bash
pnpm payload run import-products
```

### Import via API

```bash
curl -X POST https://your-site.vercel.app/api/products/import \
  -H "Authorization: Bearer YOUR_PAYLOAD_SECRET"
```

## Project Structure

```
src/
├── app/
│   ├── (payload)/          # Payload CMS admin
│   ├── (shop)/             # Shop pages
│   ├── products/           # Product detail pages
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Stripe checkout
│   └── api/                # API routes
├── components/
│   ├── layout/             # Header, Footer, MobileMenu
│   ├── product/            # ProductCard, ProductFilters
│   ├── sections/           # Hero, FeaturedProducts, TrustBadges
│   └── ui/                 # Badge
├── lib/
│   └── stripe.ts           # Stripe client
└── payload/
    ├── collections/        # Products, Categories, Collections, Orders, Users, Media
    └── globals/            # SiteSettings, Header
```

## Deployment

This project is configured for Vercel deployment.

```bash
vercel --prod
```

## License

Private
