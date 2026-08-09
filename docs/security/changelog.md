# Changelog Sicurezza — Dark Card Collection

Registro cronologico delle attività di sicurezza (analisi, modifiche, test). Formato: data | attività | file | rischio mitigato | test | stato.

---

## 2026-08-07 — Fase B (REQ-01, REQ-02, REQ-03, REQ-04, REQ-06)

### REQ-03 — Upgrade dipendenze vulnerabili + audit in CI
- `next` 15.4.11 → **16.3.0** (Payload 3.87.1 dichiara supporto `>=16.2.6 <17.0.0`; la serie 15.5.x non è supportata da Payload).
- `payload` + `@payloadcms/*` 3.86.0 → **3.87.1**.
- `sharp` 0.34.2 → **0.35.3** (0.35.0 risolveva la CVE ma aveva `exports` senza `types` → errore TS; 0.35.3 lo corregge).
- `pnpm.overrides`: `fast-uri ^3.1.5`, `brace-expansion ^2.1.4`, `js-yaml ^4.3.1` (risolvono gli ultimi 5 High transitivi senza update major dei pacchetti che li includono).
- `.github/workflows/ci.yml`: aggiunto step `pnpm audit --prod` (bloccante) tra install e typecheck.
- `package.json`: script `lint` da `next lint` (rimosso in Next 16) → `tsc --noEmit`.
- `tsconfig.json`: aggiornamento automatico Next 16 (`jsx: react-jsx`, include `.next/dev/types`).
- **Risultato `pnpm audit --prod`: 61 → 22 vuln (0 high, 18 moderate, 4 low).** Restano solo transitive senza fix disponibile (vedi [`residual-risks.md`](./residual-risks.md)).
- Test: `next build` PASSED (Next 16.3.0 + Turbopack), `vitest` 24/24 PASSED.

### REQ-01 — Prezzo server-side al checkout
- `src/app/api/stripe/checkout/route.ts`: riscritto. Accetta **solo** `{items:[{id, quantity}]}`; ignora `title/price/image/shipping` dal client. Risolve i prodotti via Local API (`payload.find` con `depth: 1`), valida `isVisible`, `status in [listed, hold]`, `storePrice > 0`, stock disponibile, quantità 1..99, max 100 item. Prezzo = `storePrice` dal DB. Spedizione calcolata server-side (soglia 80€, costo 9.99€).
- `src/app/checkout/page.tsx`: il client invia solo `id` + `quantity` (difesa in profondità).
- Mitiga **VULN-001 (Critical)**.

### REQ-02 — Protezione `GET /api/stripe/order`
- `src/app/api/stripe/order/route.ts`: verifica la sessione con `stripe.checkout.sessions.retrieve(sessionId)` server-side; se la sessione non esiste o `payment_status !== 'paid'` → **404** (nessuna disclosure). I dati restituiti ora riguardano solo una sessione Stripe verificata.
- Mitiga **VULN-002 (Critical)** (IDOR/BOLA).

### REQ-04 — Secret dedicati, comparazioni constant-time, niente secret in URL/PAYLOAD_SECRET
- Nuovo `src/lib/api-auth.ts`: `safeEqual` (timingSafeEqual), `verifyCronSecret` (solo `CRON_SECRET`, Bearer), `verifySyncPassword` (solo `SYNC_PASSWORD`, header `x-sync-password`).
- `src/app/api/cron/import/route.ts`, `cron/prices/route.ts`, `admin/backfill-images/route.ts`, `api/products/import/route.ts`: auth con `verifyCronSecret`; **rimosso `PAYLOAD_SECRET` come bearer** e **rimosso il parametro `?secret=`** da backfill-images.
- `src/app/api/admin/products/route.ts`, `[id]/route.ts`: auth con `verifySyncPassword` (solo `SYNC_PASSWORD`, constant-time).
- `src/lib/dash-auth.ts`: confronto firma HMAC con `timingSafeEqual`; chiave dedicata `DASH_SESSION_SECRET` (fallback `PAYLOAD_SECRET` per retro-compatibilità).
- `.env.example`: documentati `CRON_SECRET`, `SYNC_PASSWORD`, `DASH_SESSION_SECRET` (niente più PAYLOAD_SECRET come bearer).
- Mitiga **VULN-004 (High)**.
- **Nota operativa**: in produzione `CRON_SECRET` non è oggi configurato (si usava PAYLOAD_SECRET). **Prima del deploy impostare `CRON_SECRET`** nelle env di Vercel, altrimenti `/api/cron/import`, `/api/cron/prices` e `/api/products/import` restituiranno 401.

### REQ-06 — Webhook idempotente + validazioni + stock
- `src/payload/collections/Orders/index.ts`: `stripeSessionId` ora `unique: true`.
- Nuova migration reversibile `src/migrations/20260807_add_unique_stripe_session.ts` (UNIQUE index parziale su `orders_stripe_session_id`). Applicata e verificata su DB dev.
- `src/app/api/stripe/webhook/route.ts`:
  - Validazioni: `currency === 'eur'`, `payment_status === 'paid'`, `amount_total > 0` → altrimenti skip (Stripe ritenterà).
  - Idempotenza: create ordine + catch errore UNIQUE (`duplicate key`/`23505`) → sessione già processata, skip. Eliminato il TOCTOU find-then-create.
  - **Stock decrementato** dopo creazione ordine (clamp a 0), una sola volta per sessione.
- Mitiga **VULN-006 (High)**.
- **Rischio residuo**: decremento stock read-modify-write non atomico tra sessioni concorrenti diverse sullo stesso prodotto (rischio overselling minimo, shop single-tenant). Documentato in [`residual-risks.md`](./residual-risks.md).

### Test eseguiti in questa sessione
| Test | Esito |
|---|---|
| `pnpm audit --prod` (dopo upgrade) | **PASSED** (0 high; 22 residui moderate/low senza fix) |
| `pnpm exec tsc --noEmit` | **PASSED** |
| `pnpm test` (vitest) | **PASSED** (24/24) |
| `npx next build` | **PASSED** (Next 16.3.0) |
| `payload migrate` (DB dev) | **PASSED** (index UNIQUE creato) |
| Verifica index `orders_stripe_session_id_unique` su DB | **PASSED** |

### Note operative
- Nessuna cancellazione dati; migration reversibile.
- Non ancora applicate (fuori scope dell'approvazione): REQ-05 (sessione revocabile/SQL runner), REQ-07 (rate limiting), REQ-08..REQ-15.

---

## 2026-08-06 — Baseline (Fase A: analisi, nessuna modifica al codice)

### Analisi completata
- Inventario tecnico completo (architettura, API, DB, integrazioni, ambienti, segreti, CI/CD). → [`architecture.md`](./architecture.md)
- Superficie d'attacco per endpoint. → [`attack-surface.md`](./attack-surface.md)
- Threat model STRIDE + OWASP (16 minacce, T01–T16). → [`threat-model.md`](./threat-model.md)
- Requisiti di sicurezza prioritizzati (REQ-01..REQ-15). → [`requirements.md`](./requirements.md)
- Guida tecnica di sicurezza. → [`guide.md`](./guide.md)
- Piano di test (T-01..T-36). → [`test-plan.md`](./test-plan.md)
- Gestione segreti e rotazione. → [`secrets-management.md`](./secrets-management.md)
- Runbook incident response tecnico. → [`incident-response.md`](./incident-response.md)
- Rischi residui. → [`residual-risks.md`](./residual-risks.md)

### Risultati principali
| ID | Severità | Descrizione sintetica |
|---|---|---|
| VULN-001 | **Critical** | `POST /api/stripe/checkout` fida di prezzi/quantità/titoli inviati dal client (`src/app/api/stripe/checkout/route.ts:20-43`). |
| VULN-002 | **Critical** | `GET /api/stripe/order` espone email/item/totali di ordini altrui senza auth né verifica Stripe (`src/app/api/stripe/order/route.ts:4-42`). |
| VULN-003 | **High** | Dipendenze con CVE note: `next 15.4.11` (DoS/SSRF/middleware bypass), `sharp 0.34.2`, `fast-uri`, `dompurify` (61 vuln: 20 high, 35 moderate, 6 low). |
| VULN-004 | **High** | Admin prodotti con password statica condivisa + riuso `PAYLOAD_SECRET` come bearer; confronti non constant-time; secret in query string (`backfill-images?secret=`) (`src/app/api/admin/*`, `src/app/api/cron/*`). |
| VULN-005 | **High** | Sessione dashboard non revocabile (TTL 7gg), allowlist non riverificata, SQL runner con accesso a tutte le tabelle (`src/lib/dash-auth.ts`, `src/app/dashboard/actions.ts`, `src/lib/db-query.ts`). |
| VULN-006 | **High** | Stock mai decrementato su ordine pagato → overselling; webhook con race (TOCTOU) su ordini duplicati; nessun check valuta/status/importo (`src/app/api/stripe/webhook/route.ts`). |
| VULN-007 | **High** | Nessun rate limiting su login/contact/checkout/proxy. |
| VULN-008 | **Medium** | CSP `'unsafe-inline'/'unsafe-eval'`; HSTS assente (`next.config.ts`). |
| VULN-009 | **Medium** | proxy-image: redirect-following, nessun limite dimensione, `Access-Control-Allow-Origin: *` (`src/app/api/proxy-image/route.ts`). |
| VULN-010 | **Medium** | SSRF potenziale via `image_url` dal Google Sheet (`src/lib/image-import.ts`) + sheet letto via URL `gviz` pubblico (`src/app/api/cron/import/route.ts:16`). |
| VULN-011 | **Medium** | Errori `String(error)` esposti verso il client (`/api/admin/*`, `/api/cron/*`, `/api/products/import`). |
| VULN-012 | **Medium** | Nessun audit log/request id/monitoring/alerting. |
| VULN-013 | **Medium** | Access control Payload non esplicito; `first-register`/`register` non disabilitati esplicitamente; MFA assente. |
| VULN-014 | **Medium** | Backup/restore non configurabili/verificabili dal repo. |

### Positivi riscontrati
- Firma webhook Stripe verificata (`constructEvent`). ✓
- Nessuna carta/CVV salvata; Stripe embedded. ✓
- Query parametrizzate (Payload e pg). ✓
- Cookie dashboard HttpOnly+Secure+SameSite=Lax. ✓
- Allowlist campi su `PATCH /api/admin/products/[id]`. ✓
- `.env*` gitignored; nessun segreto reale nella storia git. ✓
- No GraphQL, no source map in prod (default), no shell/command execution. ✓
- `robots.ts` disallowa `/admin`, `/dashboard`, `/api/`. ✓

### Test eseguiti in questa sessione
- `pnpm audit --prod` → 61 vulnerabilità (6 low, 35 moderate, 20 high). Stato: **FALLITO** (bloccante fino a REQ-03).
- `git grep` + `git log -p` per secret → nessun valore reale, solo placeholder. Stato: **PASSED**.

### Prossimi passi (Fase B — in attesa di approvazione)
1. REQ-01: prezzo server-side al checkout.
2. REQ-02: protezione `/api/stripe/order`.
3. REQ-03: upgrade next/sharp/fast-uri + audit in CI.
4. REQ-04: secret dedicati, constant-time, niente secret in URL.
5. REQ-05: sessione revocabile + runner SQL limitato.
6. REQ-06: idempotenza webhook + stock.
7. REQ-07: rate limiting.
8. REQ-08..REQ-15: hardening progressivo.

### Note operative
- Nessuna modifica al codice è stata applicata in questa fase.
- Nessun deploy, nessuna cancellazione dati, nessuna modifica DB.
- Nessun segreto è riportato nei documenti.
