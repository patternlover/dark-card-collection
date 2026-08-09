# Setup Instructions

## Prerequisiti

- Node.js 20+ installato
- pnpm

> Per installare le dipendenze, configurare le variabili d'ambiente, avviare il server di sviluppo e buildare, segui la sezione [Getting Started di README.md](../../README.md).

## 1. Crea gli account necessari

### Database (Neon.io)

- Vai su https://neon.tech
- Crea un account gratuito
- Crea un database PostgreSQL
- Copia la connection string (necessaria per `DATABASE_URI`)

### Pagamenti (Stripe)

- Vai su https://stripe.com
- Crea un account gratuito
- Vai su Developers > API keys
- Copia le chiavi di test (`sk_test_` / `pk_test_`) o live (`sk_live_` / `pk_live_`)
- Vai su Developers > Webhooks, aggiungi l'endpoint `http://localhost:3000/api/stripe/webhook`, seleziona l'evento `checkout.session.completed` e copia il webhook secret

### Storage (Vercel Blob)

- Vai su Vercel Dashboard > Storage > Blob
- Crea un nuovo bucket
- Copia il token (`BLOB_READ_WRITE_TOKEN`)

> I nomi ufficiali delle variabili d'ambiente sono in [`.env.example`](../../.env.example). Copia `.env.example` in `.env.local` e compila i valori seguendo le istruzioni di [README.md](../../README.md).

## 2. Accedi all'Admin Panel

Vai su http://localhost:3000/admin

Al primo accesso ti verrà chiesto di creare un account admin. Oppure crealo in anticipo:

```bash
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=your-password pnpm create-admin
```

## 3. Aggiungi i primi dati

1. Vai su Admin > Categories
2. Crea le categorie: "Booster Box", "ETB", "Collection Box", "SPC", "Tin", "Bundle"
3. Vai su Admin > Collections
4. Crea le collezioni: "Scarlet & Violet", "Paldea Evolved", "Obsidian Flames", ecc.
5. Vai su Admin > Products
6. Aggiungi i primi prodotti

## 4. Deploy su Vercel

1. Crea un account su https://vercel.com
2. Connetti il repository GitHub
3. Aggiungi le variabili d'ambiente nel dashboard Vercel
4. Deploy automatico ad ogni push
