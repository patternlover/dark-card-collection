# SECURITY_GUIDE.md — Dark Card Collection

Stato: **bozza iniziale (Fase A)**.
Guida tecnica di sicurezza specifica per questo progetto: regole operative per chi sviluppa, deploya e opera. Strutturata per dominio (auth, authz, API/input, PostgreSQL, Stripe, frontend, segreti, supply chain/CI, logging, dati).

> Riferimenti: SECURITY_ARCHITECTURE.md, THREAT_MODEL.md, ATTACK_SURFACE.md, SECURITY_REQUIREMENTS.md, SECRETS_MANAGEMENT.md, SECURITY_TEST_PLAN.md, INCIDENT_RESPONSE_TECHNICAL.md, RESIDUAL_RISKS.md.

---

## 0. Principi guida
- **Deny by default** per ogni accesso.
- **Minimo privilegio** per ruoli, DB, token cloud e service account.
- **Zero trust**: mai fidarsi del client (prezzi, id, ruoli, flag); ogni richiesta è autenticata e autorizzata server-side.
- **Defense in depth**: validazione + autorizzazione + rate limit + logging + alert.
- Mai dichiarare il sistema "100% sicuro": ogni modifica registra rischi residui (RESIDUAL_RISKS.md).

---

## 1. Autenticazione
- Password: Payload usa PBKDF2-SHA256 (salt 32 byte, 25000 iterazioni). Non introdurre hash generici (MD5/SHA1/plaintext). Non loggare mai password.
- Sessione dashboard (`src/lib/dash-auth.ts`): cookie `dcc-dash` HttpOnly + SameSite=Lax + Secure (prod) ✓. **Da implementare**: revoca server-side, riverifica allowlist email a ogni richiesta, TTL ridotto, MFA.
- Sessione CMS: Payload local strategy; aggiungere **MFA** e rate limit sul login.
- OAuth Google: verifica `state` (cookie), `id_token` audience e `email_verified` ✓. Usare confronto **constant-time** per `state`.
- Prevenire brute force/credential stuffing: rate limit per IP e per account (REQ-07, REQ-13).
- Audit: loggare ogni login/logout admin e ogni tentativo fallito (REQ-12).

## 2. Autorizzazione (server-side)
- Mai fidarsi di: ruolo/userId/prezzo/stato ordine/sconti dal client, hidden input, local storage.
- Ogni endpoint privato: autenticazione + autorizzazione sulla **risorsa** (ownership).
- Correggere `/api/stripe/order` (REQ-02): verifica sessione Stripe server-side, nessun PII non necessario.
- Admin API: eliminare la password statica condivisa e il riuso di `PAYLOAD_SECRET` (REQ-04); integrare con il dashboard OAuth e RBAC.
- Separare customer/staff/admin/super-admin come da requisito; attualmente esiste un solo livello admin.
- Audit per: rimborsi, export, cancellazioni, modifiche prezzo, modifiche ruolo (REQ-12).

## 3. API e validazione input
- `POST /api/stripe/checkout`: accettare solo `{items:[{id,quantity}]}`; prezzi/totale/spedizione calcolati dal DB (REQ-01).
- Schema/allowlist campi: già presente in `/api/admin/products/[id]` (array `allowed`) ✓ — estendere lo stesso pattern ovunque.
- Query parametrizzate: garantite da Payload e dal runner `pg` (nessuna concatenazione) ✓.
- Limiti: dimensione body, numero item (≤20), lunghezza campi (contact), profondità payload; timeout su fetch esterni.
- CORS: assente (stesso origin) ✓; `proxy-image` restituisce `Access-Control-Allow-Origin: *` → valutare restrizione.
- Errori: risposte generiche, niente `String(error)` verso il client (REQ-11).
- Idempotenza: aggiungere key su operazioni sensibili (creazione ordine, checkout).
- Content-Type/Header: validare che il body sia JSON atteso; non fidarsi di header arbitrari.

## 4. PostgreSQL
- DB **non esposto pubblicamente** (verificare provider); connessioni TLS obbligatorie.
- Ruoli separati: utente applicativo con privilegi minimi (SELECT/INSERT/UPDATE/DELETE su schema applicativo), **mai superuser**; utente separato per le migration; separazione read/write quando possibile.
- Row-Level Security: da valutare su `orders` se un domani esiste un account customer; attualmente non applicabile (nessun multitenant customer).
- Migration: reversibili, testate in staging, approvate prima dell'applicazione in produzione.
- Backup cifrati automatici + retention + test periodico di restore (REQ-15).
- Audit accessi admin al DB; `log_statement`/`pg_stat_statements` per tracciamento.
- Il runner SQL dashboard (`src/lib/db-query.ts`): limitare tabelle, timeout, bloccare funzioni pericolose (REQ-05).

## 5. Stripe e pagamenti
Regole applicate (✓) e da applicare (☐):
- ✓ Non si salvano numeri carta/CVV (Stripe Elements/embedded, dati carta mai transitano dal backend).
- ✓ Secret key solo server-side (`src/lib/stripe.ts`); nessuna `sk_` nel bundle client.
- ✓ Firma webhook verificata con `constructEvent` + `STRIPE_WEBHOOK_SECRET`.
- ✓ HTTPS per il webhook (Vercel).
- ✓ Gestione duplicate: check pre-creazione (ma **race** da risolvere con UNIQUE constraint, REQ-06).
- ☐ Idempotenza sessioni checkout (idempotency key).
- ☐ Verifica `currency === 'eur'`, `payment_status === 'paid'`, importo coerente con il carrello calcolato server-side.
- ☐ Il redirect frontend (`checkout/success`) NON deve essere considerato conferma: la conferma avviene solo via webhook (già così ✓, ma l'endpoint `order` non verifica il pagamento).
- ☐ Gestire eventi fuori ordine e retry.
- ☐ Refund e dispute: gestire `charge.refunded`, `charge.dispute.created`, ripristinare stock.
- ☐ Audit tecnico eventi pagamento (log con event.id, esito, timestamp).
- ☐ Errori/timeout senza creare ordini incoerenti.
- ☐ Protezione refund/refund double-click (idempotenza lato Stripe API già fornita, usarla).

## 6. Frontend e browser
- Header già configurati (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, frame-ancestors, upgrade-insecure-requests); **aggiungere HSTS** (REQ-08).
- CSP: rimuovere `'unsafe-inline'/'unsafe-eval'` dove possibile (REQ-08).
- Cookie: `dcc-dash`, `dcc-oauth-state`, session Payload — HttpOnly+Secure+SameSite ✓.
- `localStorage`: solo dati non sensibili (il carrello con prezzi è manipolabile → il server non deve fidarsene, REQ-01).
- Nessun secret nel bundle: verificare che solo `NEXT_PUBLIC_*` siano inline; nessuna `sk_`.
- Source map: disabilitate in produzione (default Next.js) — verificare.
- Script terzi (Stripe, GTM): caricati solo quelli necessari; GTM solo post-consenso ✓.
- CMP custom (`useConsent`/`ConsentModeScript`): stato in localStorage, script inline statico; nessuna esecuzione di codice non autorizzato; nessun token esposto; l'analisi di conformità legale è fuori scope.
- Redirect: sempre a URL assoluti configurati (niente open redirect) ✓.

## 7. Segreti e configurazione
Vedi SECRETS_MANAGEMENT.md per l'inventario completo e la procedura di rotazione.
Regole:
- Nessun segreto in repo; `.env*` gitignored ✓ (`.env.local`, `.env.prod` presenti solo in locale).
- Non riusare `PAYLOAD_SECRET` come bearer token API (REQ-04).
- Secret per ambiente (test/live Stripe separate) ✓.
- Secret scanning in CI (REQ-03).
- Mai loggare segreti, token, session ID completi, carte.

## 8. Supply chain e CI/CD
- Upgrade dipendenze con CVE note (REQ-03): next, sharp, fast-uri, dompurify.
- `pnpm-lock.yaml` versionato ✓; `pnpm install --frozen-lockfile` in CI ✓.
- `onlyBuiltDependencies` ristretto (sharp, esbuild, unrs-resolver) ✓.
- In CI: aggiungere `pnpm audit`, osv-scanner, secret scanning, (SAST opzionale: eslint-plugin-security / semgrep), blocco su Critical/High.
- Pin delle GitHub Actions allo SHA.
- Branch protection su `main`, approval per deploy, deploy manuale in produzione (Vercel: protezione produzione).
- Review del codice generato da AI prima del merge.

## 9. Logging e monitoring
- Da implementare (REQ-12): request/correlation ID, audit log (login, modifiche prezzo/prodotto, stato ordine, refund, export, webhook con event.id, rate-limit, errori).
- **Mai** nei log: password, secret, token, session ID completi, numeri carta, CVV, payload completi non necessari.
- Alert tecnici da definire: brute force, ATO, accessi admin anomali, picchi 4xx/5xx, webhook falliti, pagamenti anomali, export massivi, accessi DB, modifiche infrastrutturali, dipendenze vulnerabili, secret esposti.
- Monitoring: sfruttare Vercel (logs, metrics) e aggiungere strumenti (Sentry, log aggregatore) — non presente nel repo.

## 10. Dati
- `orders` e `users` sono i dati più sensibili: accesso solo autenticato+autorizzato, cifratura in transito (TLS) e a riposo (provider), backup cifrati.
- `products.price` (costo acquisto) non deve essere esposto in API/storefront pubbliche — verificare che i campi restituiti dalle pagine siano whitelistati.
- Export massivi: loggare e allertare (REQ-12).
