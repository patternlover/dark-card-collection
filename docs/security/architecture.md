# Architettura di Sicurezza — Dark Card Collection

Stato: **bozza iniziale (Fase A)** — aggiornare a ogni modifica.
Documento generato con metodo: inventario tecnico (Fase 1 del piano di sicurezza) + analisi statica del repository `main@717ea4b`.

> Questo documento descrive SOLO la sicurezza tecnica (software, infrastruttura, dati, API, integrazioni, pipeline). Non copre aspetti legali/privacy.

---

## 1. Contesto e stack

E-commerce custom (nessuna piattaforma SaaS tipo Shopify) per la vendita di prodotti Pokémon TCG sigillati.

| Componente | Tecnologia | Versione rilevata |
|---|---|---|
| Framework | Next.js (App Router) | `15.4.11` (package.json) |
| CMS / data layer | Payload CMS | `3.86.0` |
| Database | PostgreSQL via `@payloadcms/db-postgres` | driver `pg ^8.22.0` |
| Pagamenti | Stripe (Checkout embedded) | SDK `stripe 22.3.2`, `@stripe/stripe-js 9.10.0` |
| Email transazionali | Resend (Payload email adapter) | `@payloadcms/email-resend 3.86.0` |
| Storage immagini | Vercel Blob | `@payloadcms/storage-vercel-blob 3.86.0` |
| Frontend UI | React 19, TailwindCSS 4 | — |
| Auth admin | Google OAuth 2.0 (email allowlist) + Payload auth locale | — |
| Deploy | Vercel (framework nextjs) | — |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) | — |
| Package manager | pnpm 10 | lockfile `pnpm-lock.yaml` |

### Moduli applicativi (src/)

- `src/app/` — pagine storefront (RSC + client), dashboard, admin CMS, `sitemap.ts`, `robots.ts`, `manifest.ts`, `security.txt` (vuoto).
- `src/app/api/` — route handler custom:
  - `stripe/checkout` (POST), `stripe/webhook` (POST), `stripe/order` (GET)
  - `auth/google` (GET), `auth/google/callback` (GET)
  - `contact` (POST), `proxy-image` (GET)
- `src/app/(payload)/` — REST API di Payload (`/api/{collection}`) e admin UI (`/admin`).
- `src/payload/collections/` — `Products`, `Categories`, `Collections`, `Orders`, `Users`, `Media`, `Messages`; globals `SiteSettings`, `Header`.
- `src/lib/` — `payload.ts`, `stripe.ts`, `dash-auth.ts`, `db-query.ts`, `group-products.ts`, `slug.ts`, `order-email.ts`, `analytics.ts`, `proxy-image.ts`, `product-image.ts`, ecc.
- `src/hooks/useCart.tsx` — carrello in `localStorage`.
- `src/migrations/` — migration Payload (`20260719_*`, `20260802_*`, `index.ts`).
- `scripts/` — `create-admin.mjs`.
- `tests/` — vitest: `cart.test.tsx`, `group-products.test.ts`, `product-filters.test.ts`, `slug.test.ts`, `sticky-add-to-cart.test.tsx`.

---

## 2. Ambienti

| Ambiente | Note |
|---|---|
| Local | `next dev`, env da `.env.local` (gitignored) |
| CI | `ci.yml`: tipo-check, unit test, build su `ubuntu-latest` con servizio PostgreSQL 16 |
| Production | Vercel (dominio `darkcardcollection.com`), env su Vercel; `.env.prod` locale copiato da Vercel CLI (gitignored) |

**Nota di verifica**: presenza di `.env.prod`/`.env.local` sul file system locale con credenziali reali in chiaro (file non versionati). Da gestire con secret manager e permessi file ristretti.

---

## 3. Schema PostgreSQL (ricavato da collections Payload + migration)

Tabelle Payload (snake_case gestito da adapter):
- `products` — titolo, slug (unique), `itemId` (unique), description, `storePrice`, `price` (costo acquisto), `compareAtPrice`, status, condition, category, collection, language, cardNumber, rarity, quantity, imageUrl, images[], averageSalePrice, featured, isVisible, ecc.
- `orders` — `orderId`, status, `items[]` (product rel, quantity, price), total, `stripeSessionId`, email.
- `users` — email, name, `salt`, `hash` (PBKDF2-SHA256, 25k iterazioni, salt 32 byte hex), `login_attempts` (Payload gestisce lockout).
- `categories`, `collections` — name/slug/description.
- `media` — file su Vercel Blob, metadata.
- `messages` — name, email, subject, message, read, replied.
- Tabelle Payload: `payload_globals`, `payload_preferences`, `payload_migrations`, ecc.

### Tabelle con dati sensibili
- `orders`: email cliente, dettagli ordine, importi → **sensibile**.
- `users`: password hash + salt → **critico**.
- `products.price` (costo acquisto) → **sensibile aziendale** (esposto solo via Local API/accesso autenticato; verificare che non sia restituito nelle API pubbliche).
- `messages`: dati contatto.

---

## 4. Ruoli e autorizzazioni

| Ruolo | Autenticazione | Permessi |
|---|---|---|
| Anonimo (cliente) | nessuna | lettura prodotti/categorie/collezioni (storefront), crea ordine di pagamento, invia messaggio contatto |
| Admin Dashboard (`/dashboard`) | Google OAuth + allowlist email `DASHBOARD_GOOGLE_EMAILS` | gestione prodotti (CRUD, raggruppati per varianti), ordini (stato), **SQL read-only su TUTTE le tabelle**, logout |
| Admin CMS (`/admin`) | Payload local auth (email+password) | pannello Payload integrale (tutte le collection) |

**Riscontro**: nessun vero RBAC (un solo livello admin). Access control delle collection Payload: **default di Payload 3** = richiede utente autenticato per REST/Admin; le pagine storefront usano la **Local API** (che salta l'access control) filtrando per `status`/`isVisible`. Da verificare con test (vedi [`test-plan.md`](./test-plan.md)).

---

## 5. Mappa dei flussi dati

### 5.1 Client → Frontend (HTML/JS)
- Origine: browser utente. Destinazione: CDN/Edge Vercel.
- Auth: nessuna. Cifratura: TLS (terminato su Vercel; **HSTS non configurato**).
- Validazione: n/a. Logging: Vercel access logs.
- Rischio principale: XSS/DOM XSS, clickjacking, header security.

### 5.2 Frontend → Backend (API custom)
- `/api/stripe/checkout` POST: il client invia `items[{id,title,price,quantity,image}]` e `shipping`.
  - Auth: nessuna. Validazione: **insufficiente** (prezzi/titoli fidati dal client). → **CRITICO (manipolazione prezzo)**.
- `/api/stripe/order` GET `?session_id=`:
  - Auth: **nessuna**. Restituisce email+items+total. → **CRITICO (BOLA / IDOR / esposizione dati)**.
- `/api/contact` POST: invio modulo contatto (no rate limit).
- `/api/proxy-image` GET `?url=`: proxy immagini Cardmarket con allowlist host.

### 5.3 Backend → PostgreSQL
- Via Local API Payload e pool `pg` (`src/lib/db-query.ts`).
- Auth: `DATABASE_URI` (utente applicativo). Cifratura: dipende dal provider (verificare SSL/TLS su connessione). Query: parametrizzate da Payload; il runner SQL della dashboard esegue **SQL libero** (whitelist read-only) → attenzione.
- Rischio: SQL injection (mitigata da parametrizzazione Payload; il runner SQL è esposto a chi ha sessione dashboard), eccesso di privilegi, mancata RLS.

### 5.4 Backend → Stripe
- `stripe.checkout.sessions.create` con `ui_mode: 'embedded_page'`. Secret key solo server-side.
- Rischio: creazione sessioni non autorizzate/abusate (no rate limit/idempotency), importi fidati dal client (flusso 5.2).

### 5.5 Stripe → Webhook (`/api/stripe/webhook`)
- Firma verificata via `constructEvent` + `STRIPE_WEBHOOK_SECRET`. ✓
- Gestione: `checkout.session.completed` (crea ordine, invia email), `payment_intent.payment_failed` (solo log).
- **Mancanze**: idempotenza sotto race, vincolo UNIQUE su `stripeSessionId`, check valuta/importo lato server contro il carrello reale, decremento stock, gestione refund/dispute.

### 5.6 (rimosso) Job cron Google Sheets
Cron import/prices e backfill immagini **rimossi** (2026-08): nessun feed esterno scrive più sul DB.

### 5.7 (rimosso) Feed manager Sheets
`google-sheets.ts`, `image-import.ts`, `parse-csv.ts` rimossi insieme al flusso legacy.

### 5.8 Pannello admin → API
- `/dashboard` (Google OAuth, cookie firmato HMAC, TTL 7gg, HttpOnly+SameSite Lax+Secure in prod) → Server Actions (`requireAuth`).
- `/admin` (Payload auth locale) → REST Payload.
- Rischio: sessione dashboard non revocabile lato server, MFA assente.

### 5.9 Pipeline → Infrastruttura
- `ci.yml`: solo `pnpm install`, `tsc`, `vitest`, `next build`. Nessun SAST/DAST/secret-scan/dependency-scan. Secret usati in CI: placeholder locali.

---

## 6. Header di sicurezza (next.config.ts)
Presenti: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, CSP, `frame-ancestors 'self'`, `upgrade-insecure-requests`.
Assenti: **HSTS** (`Strict-Transport-Security`).
CSP: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com` → `'unsafe-inline'` e `'unsafe-eval'` indeboliscono la protezione anti-XSS.

---

## 7. Logging / Monitoring / Backup (stato rilevato)
- **Logging**: solo `console.log/error` sparsi. **Nessun request ID / correlation ID**, **nessun audit log** per accessi admin, modifiche prezzo, refund, export, login falliti.
- **Errori**: `String(error)` esposto in risposte JSON di alcuni endpoint (`/api/stripe/checkout`, `/api/contact`) → info disclosure. Gli endpoint legacy admin/cron che lo esponevano sono stati rimossi (2026-08-09).
- **Monitoring**: nessuna configurazione nel repo (affidato a Vercel). Nessun alerting definito.
- **Backup**: nessuna configurazione backup/restore nel repo. Da verificare sul provider DB (Neon/Supabase/altro) e su Vercel Blob.
- **Rate limiting**: **assente su tutti gli endpoint** (checkout, contact, auth, cron, proxy).

---

## 8. Asset tecnici (inventario)
| Asset | Criticità |
|---|---|
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | critico |
| `PAYLOAD_SECRET` | critico (firma sessioni admin + cookie dashboard) |
| `DATABASE_URI` | critico |
| `BLOB_READ_WRITE_TOKEN` | alto (read/write) |
| `DASH_SESSION_SECRET` | alto (firma cookie `/dashboard`) |
| `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` | alto |
| `RESEND_API_KEY` | alto |
| Tabella `users` (hash+salt) | critico |
| Tabella `orders` (PII clienti) | critico |
| `products.price` (costo acquisto) | alto |
| Vercel Blob / immagini | medio |

---

## 9. Osservazioni di verifica rimandate
Non verificabili staticamente dal solo repository (servono test/accesso a staging):
1. Esposizione pubblica di PostgreSQL (regole di rete provider) e TLS su connessione DB.
2. Presenza di HSTS, CSP e header reali in produzione (curl).
3. Eventuali key `pk_/sk_` inline nel bundle client di produzione.
4. Source map in produzione.
5. Configurazione webhook Stripe (HTTPS, evento `checkout.session.completed`).
6. Backup cifrati + test di restore.
7. Branch protection / approval rules su GitHub.
8. Comportamento access control Payload di default su REST (test).
