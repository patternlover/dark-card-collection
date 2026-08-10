# Guida Database & Flussi - Dark Card Collection

Guida leggibile di tutta la struttura dati (Payload CMS su PostgreSQL/Neon) e di come
funzionano i flussi principali del sito (acquisto, import inventario, preordini, immagini).

> Stato al 2026-08-09. I file "sorgente di verità" sono le collection in
> `src/payload/collections/*` e i global in `src/payload/globals/*`. Il DB è generato
> da Payload con `pnpm build` (`payload generate:db-schema && payload migrate`).

---

## 1. Panoramica

- **ORM/CMS**: Payload 3.86.0 (config in `src/payload.config.ts`)
- **Database**: PostgreSQL su Neon (`DATABASE_URI`), tabelle snake_case generate da Payload
- **Storage file/immagini**: Vercel Blob (`BLOB_READ_WRITE_TOKEN`), collection `media`
- **Storefront**: Next.js 15 (App Router); pagine `/shop`, `/shop/preorders`, `/products/[slug]`
- **Pagamenti**: Stripe (checkout session + webhook)
- **Email**: Resend (solo se `RESEND_API_KEY` è configurata)

Tabelle nel DB Postgres: `users`, `products`, `categories`, `collections`, `orders`,
`media`, `messages`, `payload_migrations` + tabelle-join per gli array/relazioni
(es. `products_images`, `orders_items`, `header_nav_items`).

Ogni riga di `products` = **un singolo item fisico** (una scatola, una carta, ecc.),
con `quantity` di default a 1. Più righe con lo stesso `title` formano un "gruppo"
di varianti (lingua/condizione/prezzo) raggruppato dallo shop.

---

## 2. Collection - Schema completo

### 2.1 `products`

Ogni item dell'inventario. Gestito direttamente dal dashboard (`/dashboard`, tab "Prodotti").

| Campo | Tipo Payload | Obblig. | Unico | Default | Descrizione |
|---|---|---|---|---|---|
| `title` | text | ✅ | - | - | Nome prodotto mostrato nello shop (es. "Collezione Illustrazione Primi Compagni d'Avventura Serie 2") |
| `slug` | text | ✅ | ✅ | - | URL friendly (`/products/{slug}`) |
| `item_group_id` | text | - | - | - | **Google Merchant item_group_id**: chiave della carta (slug del titolo) per raggruppare le varianti dello stesso prodotto |
| `description` | textarea | - | - | - | Descrizione (mostrata in PDP) |
| `price` | number | - | - | - | **Prezzo di vendita** nello shop (quello che paga il cliente, Merchant `price`) |
| `sale_price` | number | - | - | - | Prezzo barrato / di confronto (Merchant `sale_price`) |
| `cost_of_goods_sold` | number | - | - | - | **Costo di acquisto** (quanto abbiamo pagato noi, Merchant `cost_of_goods_sold`) |
| `availability` | select | - | - | `in_stock` | Merchant `availability`: `in_stock`, `out_of_stock`, `preorder`, `backorder` |
| `status` | select | - | - | `listed` | `listed` = Disponibile, `hold` = In Attesa, `sold` = Venduto |
| `condition` | select | - | - | `used` | Merchant `condition` Google: `new`, `refurbished`, `used` |
| `grade` | select | - | - | `near-mint` | Grado della carta: `mint`, `near-mint`, `lightly-played`, `moderately-played`, `heavily-played`, `damaged`, `graded` |
| `is_preorder` | checkbox | - | - | `false` | **Pre-ordine / In Attesa**: visibile in `/shop/preorders` ed acquistabile |
| `category` | relationship → `categories` | - | - | - | Categoria (es. Booster Box, Sealed) |
| `collection` | relationship → `collections` | - | - | - | Set/collezione |
| `product_type` | text | - | - | - | Merchant `product_type` (es. nome collezione/categoria) |
| `google_product_category` | text | - | - | - | Merchant `google_product_category` (ID o percorso tassonomia Google) |
| `language` | select | - | - | `italian` | `italian`, `english`, `chinese`, `japanese` |
| `card_number` | text | - | - | - | Numero carta (inventario) |
| `rarity` | select | - | - | - | `common`, `uncommon`, `rare`, `rare-holo`, `ultra-rare`, `secret-rare` |
| `quantity` | number | - | - | `1` | Quantità |
| `image_link` | text | - | - | - | **URL diretto dell'immagine** (hotlink Cardmarket, Merchant `image_link`). Usato come fallback |
| `images` | array di upload → `media` | - | - | - | **Immagini ufficiali caricate su Vercel Blob** (tabella join `products_images`). Prioritario sullo storefront |
| `average_sale_price` | number (readOnly) | - | - | - | Prezzo medio di vendita storico (senza feed automatico dal 2026-08) |
| `last_price_update` | date (readOnly) | - | - | - | Ultimo aggiornamento di `average_sale_price` |
| `featured` | checkbox | - | - | `false` | Evidenziato |
| `is_visible` | checkbox | - | - | `true` | **Mostra/nascondi nello shop** (indipendente dallo stato) |

Nota: nel DB c'è una colonna legacy `image_id` non più usata dalla collection
(resto di uno schema precedente): ignorarla.

**Regole di business attuali:**
- Lo shop `/shop` mostra i prodotti con `status` in (`listed`, `hold`) **e** `is_visible = true`
  (in pratica: tutti i prodotti con un prezzo > 0 e visibili, anche se "in attesa").
- `/shop/preorders` mostra i prodotti con `is_preorder = true` **e** `is_visible = true`.
- Il badge "In Attesa" compare quando `is_preorder = true` **oppure** `status = hold`.
- **Durevolezza**: un prodotto messo in shop resta `listed` finché non viene nascosto
  via `is_visible` o cambiato manualmente dal dashboard.
- Lo status `sold` attualmente **non** viene ancora impostato dal webhook Stripe
  (è un bug noto / Fase 1 del piano): un item venduto resta `listed` e ricomprerabile.
- `availability` è derivabile da `is_preorder` / `status` / `quantity` (script `pnpm backfill:google-schema`).

### 2.2 `categories`

| Campo | Tipo | Obblig. | Unico | Descrizione |
|---|---|---|---|---|
| `name` | text | ✅ | - | Nome categoria (es. "Sealed") |
| `slug` | text | ✅ | ✅ | Slug univoco |
| `description` | textarea | - | - | Descrizione |

### 2.3 `collections`

| Campo | Tipo | Obblig. | Unico | Descrizione |
|---|---|---|---|---|
| `name` | text | ✅ | - | Nome set/collezione (es. "Mega Moonlit Tins") |
| `slug` | text | ✅ | ✅ | Slug univoco |
| `description` | textarea | - | - | Descrizione |
| `releaseDate` | date | - | - | Data di uscita |

### 2.4 `media`

File caricati (immagini) - in produzione su Vercel Blob.

| Campo | Tipo | Obblig. | Descrizione |
|---|---|---|---|
| `alt` | text | ✅ | Testo alternativo |
| `url` / `filename` / `filesize` / `mimeType` | (automatici) | - | Gestiti da Payload upload |
| `sizes` | (automatico) | - | Miniature generate: **`card`** (400x400), **`pdp`** (900x900) |
| `width` / `height` | (automatico) | - | Dimensioni originali |

### 2.5 `orders`

Ordine creato dal webhook Stripe dopo un pagamento riuscito.

| Campo | Tipo | Obblig. | Descrizione |
|---|---|---|---|
| `transaction_id` | text | ✅ | = `session.id` di Stripe (usato come titolo in admin e come `transaction_id` GA4) |
| `status` | select | - | `pending` (default), `paid`, `shipped`, `delivered`, `cancelled` |
| `items` | array | - | Riga d'ordine: `product` (relationship → `products`, obblig.), `quantity` (number, min 1, obblig.), `price` (number, obblig.) |
| `value` | number | ✅ | Totale pagato in euro (GA4 `value`) |
| `currency` | text | - | `EUR` (default) |
| `shipping` | number | - | Costo spedizione (default 0) |
| `tax` | number | - | Imposta (default 0) |
| `stripe_session_id` | text | - | Id sessione Stripe (usato per deduplicare i webhook) |
| `email` | email | ✅ | Email del cliente |

### 2.6 `users`

Utenti admin (auth Payload, accesso a `/admin`).

| Campo | Tipo | Obblig. | Descrizione |
|---|---|---|---|
| `email` | email | ✅ | Login |
| `name` | text | - | Nome |

### 2.7 `messages`

Messaggi dal form contatti.

| Campo | Tipo | Obblig. | Descrizione |
|---|---|---|---|
| `name` | text | ✅ | Nome mittente |
| `email` | email | ✅ | Email mittente |
| `subject` | text | ✅ | Oggetto |
| `message` | textarea | ✅ | Testo |
| `read` | checkbox | - | Marca come letto |
| `replied` | checkbox | - | Marca come risposto |

---

## 3. Global (contenuti singoli)

### `site-settings`
- `siteName` (text, default "Dark Card Collection")
- `description` (textarea)

### `header`
- `logo` (upload → `media`)
- `navItems` (array): `label` (text, obblig.), `url` (text, obblig.)

---

## 4. Chiavi e relazioni (mappa)

```
products.item_group_id ──────────► chiave Merchant: slug del titolo (varianti dello stesso prodotto)
products.slug ──────────────────► chiave URL, univoca
products.category ──────────────► categories.id      (molti-a-uno)
products.collection ────────────► collections.id     (molti-a-uno)
products.images[].image ────────► media.id           (via join products_images)
orders.items[].product ─────────► products.id        (via join orders_items)
header.logo ────────────────────► media.id
```

- Le relazioni sono referenziate per `id` numerico (intero, auto-increment).
- La "chiave di negozio" (Merchant `item_group_id`) è lo slug del `title`: raggruppa le
  varianti dello stesso prodotto (lingua/grade/prezzo). Non è univoca per design.

---

## 5. Immagini: come funzionano

Due "canali" convivono:

1. **`image_link`** - URL esterno (Cardmarket `product-images.s3.cardmarket.com/...`).
   È in genere una **miniatura 300x300**. Lo storefront lo usa solo come fallback,
   passando da `/api/proxy-image` (proxy pass-through, cache 7gg) per evitare hotlink.
2. **`images[]`** → collection `media` (Vercel Blob) - immagini **ufficiali e ottimizzate**.
   Lo storefront le preferisce: prima `sizes.card.url` (card 400px), poi
   `sizes.pdp.url` (900px), poi `url` pieno. Le immagini si caricano/collegano dal
   pannello Payload (`/admin`).

**Rendering** (`src/components/product/ProductImage.tsx`):
- se l'URL è Vercel Blob (`*.blob.vercel-storage.com`) usa `next/image` (serve WebP/AVIF
  alla dimensione giusta grazie a `sizes`)
- altrimenti ricade su `<img>` + proxy

---

## 6. Flussi

### 6.1 Acquisto (carrello → Stripe → ordine → email)

1. L'utente aggiunge item al carrello (localStorage via `useCart`).
2. `/checkout` → `POST /api/stripe/checkout`:
   - crea una sessione Stripe `mode=payment`, `billing_address_collection=required`,
     spedizione solo in IT, gratis dagli €80 (altrimenti +€9.99).
   - ogni riga porta `metadata.payloadProductId` = `products.id` (serve al webhook).
3. Cliente paga su Stripe.
4. Stripe invia il webhook `checkout.session.completed` a `/api/stripe/webhook`:
   - verifica firma (`STRIPE_WEBHOOK_SECRET`);
   - **dedup**: se esiste già un order con lo stesso `stripe_session_id` → esce;
   - recupera i line items, mappa ogni riga al prodotto via `metadata.payloadProductId`;
   - crea un **Order** con `status='paid'`, `items[]`, `value`, `currency`, `shipping`, `email`;
   - invia l'email di conferma via Resend (`sendOrderConfirmationEmail`) se configurata;
     se fallisce, logga ma l'ordine resta salvato.
5. Reindirizzamento a `/checkout/success?session_id=...`.

⚠️ **Bug noto**: il webhook **non** aggiorna i prodotti venduti
(niente `status='sold'`, `quantity=0`, `isVisible=false`). È la prima fase del piano
("sold flow") da implementare.

### 6.2 Gestione prodotti (dashboard → Payload)

L'import da Google Sheets è stato **rimosso**: i prodotti si creano/modificano
direttamente nel dashboard (`/dashboard`, tab "Prodotti") via server action
(`createProduct` / `updateProduct` / `deleteProduct` in `src/app/dashboard/actions.ts`).

### 6.3 Prezzi medi di vendita

Il cron `/api/cron/prices` (foglio "sales") è stato **rimosso** insieme al flusso
Sheets. `products.average_sale_price` e `last_price_update` restano nel DB ma non hanno
più un feed automatico.

Il PDP mostra "Prezzo medio di vendita" se `average_sale_price` > 0.

### 6.4 Preordini / "In Attesa" (`is_preorder`)

- Il campo `is_preorder` si imposta manualmente dal dashboard (modale prodotto).
- `/shop/preorders` mostra i prodotti con `is_preorder=true` e `is_visible=true`.
- Il badge "In Attesa" è mostrato quando `is_preorder=true` o `status=hold`.
- Per decisione, i preordini **restano acquistabili** (add to cart attivo).

### 6.5 Immagini

Le immagini si impostano via `image_link` dal dashboard (o dal pannello Payload). Il
route `/api/admin/backfill-images` è stato rimosso con il flusso legacy.

### 6.6 Dashboard (`/dashboard`)

Pannello di gestione interno in `src/app/dashboard/` con auth **reale**:

- **Auth** (`src/lib/dash-auth.ts` + `src/app/api/auth/google/*`): la pagina è un server
  component che verifica un cookie firmato (`dcc-dash`, HMAC-SHA256 con `PAYLOAD_SECRET`,
  scadenza 7 giorni, `httpOnly`). Il login è **solo con Google OAuth** (nessuna password):
  `GET /api/auth/google` genera lo state nonce e reindirizza a Google; il callback
  `/api/auth/google/callback` valida lo state (anti-CSRF), scambia il `code` e verifica
  l'ID token (`email_verified === true`); l'accesso è consentito **solo alle email nella
  whitelist** `DASHBOARD_GOOGLE_EMAILS` (lista separata da virgole). L'utente loggato è
  registrato nel cookie come `google:<email>`.
- **Panoramica**: conteggi prodotti per stato (`listed`/`hold`/`sold`/`visibili`/
  stock basso ≤1), valore inventario (somma `price × quantity` dei `listed`
  visibili), ordini per stato e fatturato (somma `value` di `paid`+`shipped`+
  `delivered`), ultimi 8 ordini.
- **Prodotti**: ricerca (titolo/item_group_id/descrizione), prodotti **raggruppati per
  `title`** in gruppi espandibili (variants): ogni riga mostra lingua, grado,
  prezzo, quantità e stato. Azioni: toggle visibilità shop (tutto il gruppo),
  modifica (modale con tutti i campi via `updateProduct`), creazione ("Nuovo
  Prodotto" via `createProduct`), eliminazione di singole varianti o dell'intero
  gruppo (`deleteProduct`).
- **Ordini**: lista con cambio status (`pending`/`paid`/`shipped`/`delivered`/
  `cancelled`) via `updateOrderStatus`.
- **SQL (sola lettura)**: tab che esegue query **read-only** sul DB via
  `runReadOnlyQuery` (`src/lib/db-query.ts`, pool `pg` lazy su `DATABASE_URI`).
  Protezioni: whitelist di soli comandi `SELECT/SHOW/EXPLAIN/WITH`, blocco di
  keyword distruttive (`DELETE`, `UPDATE`, `DROP`, `ALTER`, `INSERT`, `TRUNCATE`,
  `GRANT`, `CREATE`, ecc.), nessun multi-statement, massimo 500 righe restituite.
  Utile per interrogare inventory/prezzi senza rischiare scritture.

Tutte le server action di lettura/scrittura chiamano `requireAuth()` e rispondono
`Unauthorized` senza cookie valido.

---

## 7. Variabili d'ambiente rilevanti

| Variabile | Dove | Uso |
|---|---|---|
| `DATABASE_URI` | Neon | Connessione Postgres |
| `PAYLOAD_SECRET` | Payload | Firma sessioni admin + fallback sessione dashboard |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | Upload/lettura immagini `media` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe | Checkout (server) + webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | Checkout embedded lato client (stessa chiave di `STRIPE_PUBLISHABLE_KEY`) |
| `NEXT_PUBLIC_SITE_URL` | - | URL pubblico (success/cancel url) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Resend | Email conferma ordine (opzionale) |
| `DASH_SESSION_SECRET` | - | Firma HMAC cookie sessione `/dashboard` (fallback: `PAYLOAD_SECRET`) |
| `GOOGLE_CLIENT_ID` | Google Cloud | OAuth Client ID per il login dashboard (web) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud | OAuth Client Secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | - | Redirect URI OAuth (default `${NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`) |
| `DASHBOARD_GOOGLE_EMAILS` | - | Whitelist email abilitate alla dashboard (separate da virgola) |

---

## 8. Prossimi passi (roadmap concordata)

1. **Sold flow** - webhook marca `status='sold'`, `quantity=0`, `is_visible=false`;
   `groupProducts` calcola prezzi/stock solo dai varianti `listed`; shop filtra per `is_visible`.
2. **Feed Google Merchant** - feed prodotti (`price`, `sale_price`, `cost_of_goods_sold`,
   `availability`, `condition`, `item_group_id`, `product_type`, `google_product_category`)
   pronti per l'export (schema già allineato, 2026-08-09).
3. **Schema esteso** - nuovi campi Products (purchaseDate, holdEndDate, targetPrice,
   expectedRoi, marketPrice, notes, soldDate…) + collection `Sales`
   (piattaforma, commissioni, shipping, profitto, ROI reale, stripe_session_id).
4. ✅ **Rimozione Google Sheets** - fatto (cron import/prices, `/admin/products`,
   `google-sheets.ts`, `parse-csv.ts`, `image-import.ts`, `api-auth.ts`, script
   `import-products.ts` rimossi; gestione prodotti nel dashboard).
