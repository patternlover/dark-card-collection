# PENDING — Unico punto per TUTTE le task in sospeso

> Stati: `open` · `in-progress` · `blocked (motivo)` · `waiting-user` · `done (verifica)`.
> Un task si chiude SOLO con verifica fatta (`pnpm lint`, `pnpm test`, build/E2E/CI dove applicabile).

Ultimo aggiornamento: 2026-09-05 (cutover Medusa completato — sito live su Medusa, Payload rimosso).

---

## 1. Aperti (da fare)

| # | Task | Stato |
|---|------|-------|
| R3 | **Checkout Stripe (Payment Element)**: il backend funziona (payment session + ordine verificati via API con provider `pp_stripe_stripe`), ma il flusso browser fallisce ("processing error" / bloccato su preparazione). Diagnostica in corso con log `[checkout]` + codice errore; ipotesi aperta: chiave pubblicabile nel build preview, CSP, stato PaymentIntent. **Bloccante per riaprire le vendite** | open (bloccante) |
| R3b | Dopo il checkout: verificare **webhook Stripe** (`https://medusa.darkcardcollection.com/hooks/payment/stripe`, evento `payment_intent.succeeded`) + cattura ordine + email Resend end-to-end | open |
| R3c | Registrare il **feed Google Merchant** `/api/feed/products` in Merchant Center | open |
| R4 | **F4 — Hardening**: promotions, returns/exchanges, backup verificato, monitoring (Uptime Kuma), aggiornamenti regolari VM | open |
| — | **Scontrini lotti** (upload su Google Drive dalla route Admin Lotti): il campo `receipt_url` esiste nel modulo procurement, l'integrazione Drive non è portata da Payload | open |
| W6 | **Repo privata**: la repo è pubblica. Dopo `gh auth login`: `gh repo edit patternlover/dark-card-collection --visibility private` | waiting-user (auth gh) |
| W5 | **Immagini**: 2 file in `images/` senza prodotto (`bundle-ascesa-eroica.webp`, `scatola-da-collezione-mega-moonlit-tins-mega-gengar-ex.webp`) — caricare su Vercel Blob quando i prodotti esisteranno | waiting-user |

## 2. Non-goal / chiusi per scelta

| # | Voce | Motivo |
|---|------|--------|
| N1 | Replica dei flussi ops nel frontend | Ops vive in Medusa Admin (ordini, lotti, magazzino, listino, clienti) |
| N2 | Pagamenti senza provider | Medusa non processa pagamenti: serve Stripe (o altro provider); `pp_system_default` solo per test/back-office |
| N3 | SSO custom per Admin | Admin Medusa = email/password (invite); eventuale SSO rimandato |

## 3. Chiusi con verifica

| # | Task | Verifica |
|---|------|----------|
| R0 | Replatform Medusa F0 — scaffold backend | done (2026-08-28: migrate+seed, Admin 200, store API ok) |
| R1 | Replatform Medusa F1 — modulo `procurement` (lotti/FIFO/costo medio/margini) + API admin + Admin UI | done (2026-08-29: tsc ✓, test 13/13 ✓, lot→stock+avg, vendita esterna→ordine+FIFO+snapshot, build ✓) |
| R2 | Replatform Medusa F2 — storefront su Medusa (catalogo, cart, checkout, account, analytics) | done (2026-08-29: tsc ✓, test 104/104 ✓, smoke shop/PDP/account ✓) |
| R3 | Replatform Medusa F3 — **cutover**: backend live Oracle, merge su main, **Payload rimosso**, prod verificato | done (2026-09-05: prod /shop 200 Medusa, /admin e /dashboard 404, build+tsc+test ✓) |
| C1 | Analytics GA4: clear `ecommerce: null` prima di ogni push | done (2026-09-05: pattern in `src/lib/analytics.ts`) |
| C2 | Contact form senza Payload (email Resend) | done (2026-09-05) |

## 4. Storico chiuso (pre-Medusa)

Le task dell'era Payload/dashboard (data-cleanup legacy, server actions senza throw, divergenza stock, Drive scontrini dashboard, ecc.) sono **chiuse per obsolescenza**: Payload è stato rimosso (2026-09-05). Dettagli nelle sessioni `docs/project/sessions/`.