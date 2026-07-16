# DARK CARD COLLECTION — Project Context Document

## 1. Project Overview

**Nome progetto:** Dark Card Collection
**Tipo:** E-commerce Pokémon TCG sealed products
**Obiettivo:** Store online professionale, mobile-first, con pagamenti Stripe e gestione prodotti tramite CMS

### Target User
- Collezionisti di sealed Pokémon TCG
- Appassionati che seguono le nuove espansioni
- Clienti che cercano box, ETB, SPC, collection box
- Utenti mobile che vogliono navigare e comprare rapidamente

### Brand Identity
- Premium accessibile, non lussuoso
- Affidabilità e cura del prodotto
- Specialista, non mass market
- Non infantile, non "fan art"
- Estetica da collezionismo serio

---

## 2. Tech Stack

| Componente | Scelta | Motivazione |
|------------|--------|-------------|
| **Framework** | Next.js 14+ (App Router) | Full-stack, SSR, SEO ottimale, API routes |
| **CMS** | Payload CMS 3.x | Integrato con Next.js, admin panel, open source |
| **Database** | PostgreSQL (via Payload) | Robusto, affidabile, production-ready |
| **Storage** | Vercel Blob Storage | Integrato con deploy, semplice per principianti |
| **Pagamenti** | Stripe | Standard industriale, sicuro, documentazione eccellente |
| **Styling** | Tailwind CSS | Utility-first, veloce, responsive facile |
| **Hosting** | Vercel | Ottimale per Next.js, deploy automatico, free tier |
| **Language** | TypeScript | Type safety, better DX, meno bug |

### Why this stack for a beginner:
- **Next.js + Payload** = un solo progetto, non due separati
- **Vercel** = deploy con un click, zero configurazione server
- **Tailwind** = design responsive senza CSS complesso
- **Stripe** = documentazione eccellente, SDK semplici

---

## 3. Project File Structure

```
dark-card-collection/
├── payload.config.ts              # Configurazione Payload CMS
├── next.config.ts                 # Configurazione Next.js
├── tailwind.config.ts             # Configurazione Tailwind
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dipendenze
├── .env.local                     # Variabili d'ambiente (SECRET)
├── .env.example                   # Template variabili d'ambiente
├── .gitignore
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Layout root (header, footer)
│   │   ├── page.tsx                # Homepage
│   │   ├── globals.css             # Stili globali + Tailwind
│   │   │
│   │   ├── (shop)/                 # Route group - Shop pages
│   │   │   ├── layout.tsx          # Layout shop
│   │   │   ├── page.tsx            # /shop - Catalogo
│   │   │   ├── collections/
│   │   │   │   ├── page.tsx        # Lista collezioni
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Pagina collezione
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx        # Lista categorie
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Pagina categoria
│   │   │   ├── preorders/
│   │   │   │   └── page.tsx        # Prodotti in preordine
│   │   │   ├── new-arrivals/
│   │   │   │   └── page.tsx        # Nuovi arrivi
│   │   │   └── bestsellers/
│   │   │       └── page.tsx        # Bestseller
│   │   │
│   │   ├── products/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # /products/[slug]
│   │   │
│   │   ├── cart/
│   │   │   └── page.tsx            # /cart
│   │   │
│   │   ├── checkout/
│   │   │   └── page.tsx            # /checkout
│   │   │
│   │   ├── api/
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/
│   │   │   │   │   └── route.ts    # Crea sessione checkout
│   │   │   │   ├── webhook/
│   │   │   │   │   └── route.ts    # Stripe webhook
│   │   │   │   └── success/
│   │   │   │       └── route.ts    # Redirect dopo pagamento
│   │   │   └── cart/
│   │   │       └── route.ts        # API carrello
│   │   │
│   │   ├── info/
│   │   │   ├── about/page.tsx      # /info/about
│   │   │   ├── faq/page.tsx        # /info/faq
│   │   │   └── contact/page.tsx    # /info/contact
│   │   │
│   │   └── admin/
│   │       └── [[...segments]]/
│   │           └── page.tsx        # /admin/*
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── SearchBar.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx
│   │   │
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── ProductInfo.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   └── RelatedProducts.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CartDrawer.tsx
│   │   │
│   │   └── sections/
│   │       ├── HeroSection.tsx
│   │       ├── FeaturedProducts.tsx
│   │       ├── TrustBadges.tsx
│   │       └── Newsletter.tsx
│   │
│   ├── lib/
│   │   ├── stripe.ts               # Stripe client setup
│   │   ├── utils.ts                # General utilities
│   │   ├── constants.ts            # App constants
│   │   └── validations.ts          # Form validations
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useSearch.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── styles/
│   │   └── fonts.ts                # Font definitions
│   │
│   └── payload/
│       ├── collections/
│       │   ├── Products.ts
│       │   ├── Categories.ts
│       │   ├── Collections.ts
│       │   ├── Orders.ts
│       │   ├── Users.ts
│       │   └── Media.ts
│       │
│       └── globals/
│           ├── SiteSettings.ts
│           └── Header.ts
│
├── public/
│   ├── images/
│   │   ├── logo/
│   │   ├── banners/
│   │   └── placeholders/
│   └── robots.txt
│
└── docs/
    ├── SETUP.md
    └── DEPLOY.md
```

---

## 4. Database Schema (Payload Collections)

### Products
```typescript
{
  id: string
  title: string                    // "Booster Box Scarlet & Violet"
  slug: string                     // "booster-box-scarlet-violet"
  description: richText            // Descrizione prodotto
  price: number                    // 149.99
  compareAtPrice?: number          // Prezzo originale (per sconti)
  images: Media[]                  // Galleria immagini
  category: Categories             // "booster-box" | "etb" | "collection-box" | etc.
  collection: Collections          // "scarlet-violet" | "paldea-evolved" | etc.
  status: "in-stock" | "preorder" | "out-of-stock"
  sealed: boolean                  // true = prodotto sigillato
  features?: string[]              // ["10 booster packs", "65 cards", etc.]
  weight?: number                  // Per calcolo spedizione
  sku: string                      // SKU univoco
  stripePriceId?: string           // ID prezzo Stripe
  stripeProductId?: string         // ID prodotto Stripe
  isNew: boolean                   // Badge "Novità"
  isBestseller: boolean            // Badge "Bestseller"
  isFeatured: boolean              // In evidenza homepage
  releaseDate?: Date               // Data release (per preorder)
  quantity: number                 // Disponibilità magazzino
  createdAt: Date
  updatedAt: Date
}
```

### Categories
```typescript
{
  id: string
  name: string                     // "Booster Box"
  slug: string                     // "booster-box"
  description?: string
  image?: Media
  products: Products[]
}
```

### Collections (Espansioni)
```typescript
{
  id: string
  name: string                     // "Scarlet & Violet"
  slug: string                     // "scarlet-violet"
  description?: string
  image?: Media
  releaseDate: Date
  products: Products[]
}
```

### Orders
```typescript
{
  id: string
  stripeSessionId: string
  stripePaymentIntent?: string
  customer: Users
  items: [{
    product: Products
    quantity: number
    price: number
  }]
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  shippingAddress: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  total: number
  createdAt: Date
}
```

### Users
```typescript
{
  id: string
  email: string
  name: string
  orders: Orders[]
  createdAt: Date
}
```

### Media
```typescript
{
  id: string
  url: string                      // Vercel Blob URL
  alt: string
  width?: number
  height?: number
}
```

---

## 5. Environment Variables

```env
# Database
DATABASE_URI=postgresql://user:pass@host:5432/dark_card_db

# Payload
PAYLOAD_SECRET=your-secret-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Admin (optional)
ADMIN_EMAIL=admin@darkcardcollection.com
```

---

## 6. Stripe Integration Flow

```
1. User clicks "Acquista"
          ↓
2. Next.js API Route creates Stripe Checkout Session
   - Passa: line_items (product, quantity, price)
   - Passa: success_url, cancel_url
   - Passa: metadata (orderId, userId)
          ↓
3. User redirected to Stripe Checkout (hosted page)
          ↓
4. User completes payment
          ↓
5. Stripe redirects to /checkout/success?session_id=...
          ↓
6. Stripe sends webhook to /api/stripe/webhook
   - event: checkout.session.completed
   - Update Order status to "paid"
   - Update product quantity
          ↓
7. User sees success page
```

---

## 7. Deployment Strategy

### Recommended: Vercel
```
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push
```

### Database: Neon (PostgreSQL)
- Free tier available
- Integrates easily with Payload
- Serverless-ready

### Checklist before deploy:
- [ ] Create Stripe account and get API keys
- [ ] Create Neon database and get connection string
- [ ] Create Vercel Blob storage token
- [ ] Generate Payload secret
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Test checkout flow in Stripe test mode

---

## 8. Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## 9. Key Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js App Router | Best for SEO + full-stack |
| CMS | Payload 3.x | Native Next.js integration |
| DB | PostgreSQL | Production-ready, reliable |
| Storage | Vercel Blob | Simple, integrated |
| Payments | Stripe | Industry standard, great docs |
| Styling | Tailwind | Fast, responsive, no CSS hell |
| Hosting | Vercel | Zero-config for Next.js |
| Language | TypeScript | Safety for beginners |

---

## 10. Implementation Order

1. **Phase 1:** Project setup (Next.js + Payload + Tailwind)
2. **Phase 2:** Database schema (Payload collections)
3. **Phase 3:** Layout components (Header, Footer, Navigation)
4. **Phase 4:** Homepage design
5. **Phase 5:** Product listing pages (Shop, Collections, Categories)
6. **Phase 6:** Product detail page
7. **Phase 7:** Cart functionality
8. **Phase 8:** Stripe integration
9. **Phase 9:** Checkout flow
10. **Phase 10:** Admin panel customization
11. **Phase 11:** Responsive polish
12. **Phase 12:** Testing + deployment
