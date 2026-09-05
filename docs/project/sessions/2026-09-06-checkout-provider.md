# Sessione 2026-09-06 — Checkout Stripe R3 + Bonifico manuale

> PENDING di riferimento: `docs/project/PENDING.md` (R3 bloccante checkout browser, R3b webhook, R3c feed).
> Decisione provider (chat 2026-09-06): **si resta su Stripe** (1,5% + 0,25€ SEE, ufficiale Medusa,
> zero canone — il più economico ai volumi attuali <2k€/mese). Mollie più cara sulle carte,
> Nexi/Adyen richiedono custom provider ingiustificato ora, crypto scartata. Satispay diretto
> solo quando si apriranno le singole <10€.

## Plan (scritto prima di iniziare)

**Obiettivo:** rendere il checkout acquistabile end-to-end: fix flusso browser Stripe (R3),
tema dark del Payment Element (Appearance API, SAQ-A invariato), secondo metodo
**Bonifico manuale a 0%** via provider di sistema.

**Diagnosi R3 (da code review):**
1. `src/app/checkout/page.tsx` — l'init del Payment Element è nel `useEffect` con deps
   `[items, cartId, email, total]`: digitare l'email re-inizializza tutto (nuova payment
   collection + remount su `#payment-element` senza `unmount()`) → "bloccato su preparazione".
2. La route `src/app/api/medusa/checkout/route.ts` crea una **nuova payment collection a ogni
   chiamata** senza riuso (pile-up / errori "already has").
3. Il path Stripe **non chiama mai `cart/complete`** (solo polling di `cart.order_id` che non
   verrà mai settato) e **non imposta mai gli indirizzi** (Medusa richiede `shipping_address`
   per completare fisici) → pagamento ok ma ordine mai creato.
4. `src/app/checkout/success/page.tsx` legge l'ordine via `GET /store/orders/:id` **senza token**
   → 404 per i guest (la maggioranza).

**File coinvolti:**
- `src/app/api/medusa/checkout/route.ts` (upsert email+indirizzi, riuso payment collection)
- `src/app/api/medusa/order/route.ts` (+ `POST {cart_id}` = tentativo singolo di `complete`
   con summary ordine; `GET` con forward del token cliente)
- `src/app/checkout/page.tsx` (tabs Carta/Bonifico, form indirizzo, init una tantum per
   cartId+metodo, Appearance dark, `confirmPayment` → `complete` con retry → snapshot ordine)
- `src/app/checkout/success/page.tsx` (snapshot da sessionStorage prima della fetch API)
- `src/lib/checkout.ts` (nuovo: validazione indirizzo, snapshot helpers, retryable errors) + test

**Verifica prevista:** `pnpm lint` · `pnpm test` · `pnpm build` · E2E manuale carta `4242…`
+ bonifico · push `main` + CI.

## Changelog

**Fix R3 (codice, commit da fare):**
- `src/lib/checkout.ts` (nuovo): `validateCheckoutForm`, `isRetryableCompleteError`,
  snapshot ordine in sessionStorage (`save/load/clearOrderSnapshot`, `globalThis`-safe),
  `toOrderSummary` (centesimi→euro), `STRIPE_APPEARANCE` dark (accent `#FACC15`).
- `src/app/api/medusa/checkout/route.ts`: upsert email + `shipping/billing_address` sul cart;
  `ensurePaymentCollection` (riuso collection esistente via `?fields=` con fallback a create);
  path `system` (bonifico) restituisce `{order_id, order}` con summary.
- `src/app/api/medusa/order/route.ts`: nuovo `POST {cart_id}` = singolo tentativo di
  `cart/complete` con flag `retryable`; `GET` con forward del Bearer token (loggati).
- `src/app/checkout/page.tsx`: tabs **Carta/Bonifico**; form email+indirizzo (CAP 5 cifre);
  init Payment Element **una tantum per (cartId, metodo)** con `unmount()` corretto;
  submit carta = sync indirizzi → `confirmPayment` → `complete` con retry (~30s per il
  webhook) → snapshot → redirect; submit bonifico = ordine immediato via provider system.
- `src/app/checkout/success/page.tsx`: legge prima lo snapshot (guest), poi API con token.
- `next.config.ts`: `Permissions-Policy payment=(self "https://js.stripe.com")` (wallet);
  rimossi redirect `/dashboard/*` obsoleti (dashboard rimossa al cutover).

**Diagnosi confermate e chiuse:** re-init a ogni tasto (email nelle deps) · collection
duplicata a ogni apertura · `complete` mai chiamata sullo path Stripe · indirizzi mai
impostati · success 404 per i guest.

**Verifica:** `tsc --noEmit` 0 errori · test **43/43** ✓ (11 nuovi in `tests/checkout.test.ts`)
· `next build` ok (31 pagine).
**Resta:** E2E su preview/live (carta test + bonifico + webhook R3b) — richiede env Vercel,
non eseguibile da qui (`.env.local` è legacy pre-Medusa, senza publishable key).

### Fix 2026-09-06 (sera) — `payment_intent_unexpected_state` live
- Causa: l'intent confermato non era quello attivo — il submit ricreava la sessione
  (ruotando l'intent montato) e veniva presa `payment_sessions[0]` (stale su collection
  riusata); retry dopo pagamento riuscito riconfermava un intent già `succeeded`.
- `POST /api/medusa/checkout` con `sync_only: true` (sync cart/spedizione senza toccare
  le sessioni) · `pickPaymentSession` (ultima sessione del provider) in `src/lib/checkout.ts`.
- `src/app/checkout/page.tsx`: `clientSecretRef`, `retrievePaymentIntent` prima di
  `confirmPayment` (se già `succeeded`/`requires_capture` → diretto a `complete`) e recovery
  sullo stesso errore dopo `confirmPayment`.
- **Verifica:** tsc 0 · test **46/46** · `next build` ok.
