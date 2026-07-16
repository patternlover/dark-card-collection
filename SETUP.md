# Setup Instructions

## Prerequisiti
- Node.js 18+ installato
- npm o pnpm
- Account Stripe (gratuito)
- Database PostgreSQL (consiglio Neon.io - piano free)

## 1. Installa le dipendenze

```bash
# Se usi npm
npm install

# Se usi pnpm (più veloce)
pnpm install
```

## 2. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

### Cosa serve:

**DATABASE_URI**
- Vai su https://neon.tech
- Crea un account gratuito
- Crea un database PostgreSQL
- Copia la connection string in formato `postgresql://...`

**PAYLOAD_SECRET**
- Genera una stringa casuale di almeno 32 caratteri
- Puoi usare: `openssl rand -base64 32` nel terminale

**STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY**
- Vai su https://stripe.com
- Crea un account gratuito
- Vai su Developers > API keys
- Copia le chiavi di test (inizia con `sk_test_` e `pk_test_`)

**STRIPE_WEBHOOK_SECRET**
- Vai su Stripe Dashboard > Developers > Webhooks
- Aggiungi un endpoint: `http://localhost:3000/api/stripe/webhook`
- Seleziona eventi: `checkout.session.completed`
- Copia il webhook secret

**BLOB_READ_WRITE_TOKEN**
- Vai su Vercel Dashboard > Storage > Blob
- Crea un nuovo bucket
- Copia il token

## 3. Avvia il server di sviluppo

```bash
npm run dev
```

Il sito sarà disponibile su http://localhost:3000

## 4. Accedi all'Admin Panel

Vai su http://localhost:3000/admin

Al primo accesso ti verrà chiesto di creare un account admin.

## 5. Aggiungi i primi dati

1. Vai su Admin > Categories
2. Crea le categorie: "Booster Box", "ETB", "Collection Box", "SPC", "Tin", "Bundle"
3. Vai su Admin > Collections
4. Crea le collezioni: "Scarlet & Violet", "Paldea Evolved", "Obsidian Flames", ecc.
5. Vai su Admin > Products
6. Aggiungi i primi prodotti

## 6. Deploy su Vercel

1. Crea un account su https://vercel.com
2. Connetti il repository GitHub
3. Aggiungi le variabili d'ambiente nel dashboard Vercel
4. Deploy automatico ad ogni push
