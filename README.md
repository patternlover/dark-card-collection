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
- Product detail page with stock info, variant availability, short description, quantity selector and sticky add-to-cart bar (appears only when the main button scrolls out of view, on mobile and desktop)
- Product filtering: always-visible sidebar filters on the left (condition, language, category, collection) with a search bar on top of every listing page
- Social proof bar on the homepage ("N collezionisti hanno aggiunto al carrello nelle ultime 24 ore")
- Footer pinned to the bottom on short pages (flex layout shell with all-black background)
- Free shipping over €60 (displayed in a banner below the navbar and in a dedicated animated CTA section on the homepage)
- Hold/SPC products shown in the shop as one grouped card with total stock (listings are kept durable against the daily import cron)
- Variant management with edit and delete (Payload-only, no Sheets impact)
- Product visibility toggle (`isVisible`) - control which products appear in the shop independently of status
- Daily cron jobs for import and price updates
- GA4 ecommerce tracking via GTM
- SEO: `robots.txt`, `sitemap.xml`, manifest, SVG favicon, OG metadata, JSON-LD structured data
- Neobrutalism design: yellow accent (`#FACC15`) on brand elements, all-black footer with legal links in the bottom bar
- Order confirmation emails via Resend
- Unit tests (Vitest) + CI pipeline on GitHub Actions

## Database Schema

PostgreSQL (Neon), managed by Payload CMS. Migrations live in `src/migrations/`.

```
dark_card_collection (Neon PostgreSQL)
├── users                        # Admin accounts
│   ├── id, name, email (unique)
│   └── auth: salt, hash, reset_password_token, login_attempts, lock_until
│       └── users_sessions       # (1:N) login sessions
├── media                        # Uploaded images (Vercel Blob)
│   ├── id, url, filename, mime_type, filesize, width, height
│   └── sizes: card (url, width, height, filename) / pdp (url, width, height, filename)
├── categories                   # ETB, Collection, SPC, Tin...
│   └── id, name, slug (unique), description
├── collections                  # Expansions/sets (es. "Prismatic Evolutions")
│   └── id, name, slug (unique), description, release_date
├── products                     # Storefront variants (grouped by title)
│   ├── id, title, slug (unique), item_id (unique, from Google Sheets)
│   ├── pricing: price, store_price, compare_at_price, average_sale_price, last_price_update
│   ├── state: status (enum: listed|hold|sold), product_state, is_preorder, is_visible, featured
│   ├── details: description, condition (enum), language (enum), rarity, card_number
│   ├── stock: quantity
│   ├── created_at, updated_at
│   ├── belongsTo categories (category_id, on delete set null)
│   ├── belongsTo collections (collection_id, on delete set null)
│   └── products_images          # (1:N) join to media for product images
├── orders                       # Checkout orders
│   ├── id, order_id, status (enum: pending|paid|fulfilled|cancelled)
│   ├── total, email, stripe_session_id
│   └── orders_items             # (1:N) snapshot of purchased items
│       └── product_id → products, quantity, price (unit)
└── messages                     # Contact form submissions
    └── id, name, email, subject, message, read, replied
```

Payload internals (managed automatically): `payload_kv`, `payload_preferences` (+ rels),
`payload_locked_documents` (+ rels), `payload_migrations`.

### Globals

```
├── header          # site_header: logo → media, nav_items[] (label, url)
└── site_settings   # site_name, description
```

### Migrations

| Name | Purpose |
|------|---------|
| `20260719_131233` | Initial schema |
| `20260719_add_image_url` | Add `image_url` to products |
| `20260719_add_product_state` | Add `product_state` to products |
| `20260720_add_is_visible` | Add `is_visible` (default true) to products |
| `20260802_202035` | Add `description`, `products_images`, stock handling |

## Testing

```bash
pnpm test
```

Unit tests live in `tests/` and cover the pure lib modules (`group-products.ts`, `parse-csv.ts`) and the sticky add-to-cart visibility logic (`sticky-add-to-cart.test.tsx`, rendered in a DOM environment).

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`: type-check (`tsc --noEmit`), unit tests (`vitest`), and `next build` with placeholder env vars (no real DB required).

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
NEXT_PUBLIC_SITE_URL=https://darkcardcollection.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@darkcardcollection.com
CRON_SECRET=your-cron-secret
SYNC_PASSWORD=your-admin-password
GOOGLE_SERVICE_ACCOUNT=...
```

### Payments (Stripe)

- **Produzione**: usa le chiavi live (`sk_live_...`, `pk_live_...`) dal Dashboard Stripe.
- **Webhook**: registra l'endpoint `https://darkcardcollection.com/api/stripe/webhook` nel Dashboard Stripe con l'evento `checkout.session.completed` e usa il relativo `whsec_live_...` come `STRIPE_WEBHOOK_SECRET`.
- `NEXT_PUBLIC_SITE_URL` deve puntare al dominio di produzione, perché viene usata per le URL di successo/annullamento del checkout.

### Email di conferma ordine

Dopo un checkout completato, il webhook Stripe invia un'email di conferma al cliente tramite **Resend**:

- Crea una API key su [resend.com](https://resend.com) e imposta `RESEND_API_KEY` (per la produzione, verifica anche il tuo dominio per il campo `from`).
- `EMAIL_FROM` (default `noreply@darkcardcollection.com`).
- Senza `RESEND_API_KEY` l'email non parte: il webhook logga l'errore ma l'ordine viene comunque creato.
- Il template è in `src/lib/order-email.ts`.

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront.
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the admin dashboard.

### Build

```bash
pnpm build
```

On WSL the type-check phase can run out of heap memory. If the build crashes with a JavaScript heap OOM error, raise the Node heap and retry:

```bash
NODE_OPTIONS="--max-old-space-size=6144" pnpm build
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
- Variants are only visible in `/admin/products` - the storefront shows grouped parent products
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
