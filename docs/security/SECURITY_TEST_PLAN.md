# SECURITY_TEST_PLAN.md — Dark Card Collection

Stato: **bozza iniziale (Fase A)** — tutti i test `DA ESEGUIRE` salvo diversa indicazione. Classificazione: `AUTO` (automatico/vitest), `MAN` (manuale), `STG` (solo staging), `PROD` (solo con autorizzazione esplicita), `PENT` (da affidare a penetration tester).

> Regola: nessun test intrusivo/distruttivo in produzione senza autorizzazione esplicita.

---

## 1. Mappa test ↔ requisiti

| ID | Test | Requisito | Tipo | Stato |
|---|---|---|---|---|
| T-01 | Manipolazione prezzo/quantità/titolo al checkout | REQ-01 | AUTO/STG | DA ESEGUIRE |
| T-02 | BOLA/IDOR su `/api/stripe/order` | REQ-02 | STG/PENT | DA ESEGUIRE |
| T-03 | Webhook: firma errata | REQ-06 | AUTO/STG | DA ESEGUIRE |
| T-04 | Webhook: modificato/replay | REQ-06 | STG/PENT | DA ESEGUIRE |
| T-05 | Webhook: duplicato e concorrente | REQ-06 | STG | DA ESEGUIRE |
| T-06 | Webhook: valuta/importo/ordine inesistente/già pagato | REQ-06 | STG | DA ESEGUIRE |
| T-07 | Stock: acquisto oltre disponibilità, race, doppio click | REQ-06 | STG | DA ESEGUIRE |
| T-08 | Refund/dispute e ripristino stock | REQ-06 | STG | DA ESEGUIRE |
| T-09 | Auth dashboard: revoca sessione, allowlist rimossa | REQ-05 | AUTO/STG | DA ESEGUIRE |
| T-10 | SQL runner: blocchi (`pg_sleep`, DML, multi-statement), timeout | REQ-05 | AUTO/STG | DA ESEGUIRE |
| T-11 | Admin API: password errata, timing, niente `PAYLOAD_SECRET` | REQ-04 | AUTO/STG | DA ESEGUIRE |
| T-12 | Secret in query string / header | REQ-04 | AUTO | DA ESEGUIRE |
| T-13 | Rate limiting (login, contact, checkout, proxy) | REQ-07 | STG | DA ESEGUIRE |
| T-14 | Header di sicurezza (HSTS, CSP, frame, nosniff) | REQ-08 | MAN/PROD | DA ESEGUIRE |
| T-15 | XSS (stored su titoli/messaggi, reflected, DOM) | REQ-08/REQ-13 | STG/PENT | DA ESEGUIRE |
| T-16 | SSRF proxy-image (redirect, localhost, metadata) | REQ-09 | STG/PENT | DA ESEGUIRE |
| T-17 | Limiti dimensione immagini/import (bomb) | REQ-09 | STG | DA ESEGUIRE |
| T-18 | Feed: accesso anonimo allo sheet | REQ-10 | MAN | DA ESEGUIRE |
| T-19 | Errori: niente dettagli interni | REQ-11 | AUTO/STG | DA ESEGUIRE |
| T-20 | Log: contenuto e assenza di dati vietati | REQ-12 | MAN/STG | DA ESEGUIRE |
| T-21 | Access control Payload (CRUD anonimo/autenticato per collection) | REQ-13 | AUTO/STG | DA ESEGUIRE |
| T-22 | Creazione account pubblica / first-register disabilitato | REQ-13 | AUTO/STG | DA ESEGUIRE |
| T-23 | Brute force login CMS + lockout | REQ-07/REQ-14 | STG/PENT | DA ESEGUIRE |
| T-24 | MFA admin | REQ-14 | MAN/STG | DA ESEGUIRE |
| T-25 | Backup e restore | REQ-15 | STG/PROD | DA ESEGUIRE |
| T-26 | Dipendenze: `pnpm audit` e osv-scanner (CI) | REQ-03 | AUTO | DA ESEGUIRE |
| T-27 | Secret nel bundle client / source map | REQ-08 | MAN/PROD | DA ESEGUIRE |
| T-28 | Session fixation/hijacking dashboard | REQ-05 | STG/PENT | DA ESEGUIRE |
| T-29 | Manipolazione cookie SameSite/CSRF | REQ-13 | STG/PENT | DA ESEGUIRE |
| T-30 | Race condition stock/ordine | REQ-06 | STG/PENT | DA ESEGUIRE |
| T-31 | Mass assignment (campi extra) | REQ-01/REQ-13 | AUTO | DA ESEGUIRE |
| T-32 | Prototype pollution / payload profondi | REQ-01 | AUTO | DA ESEGUIRE |
| T-33 | File upload (media) tipi non consentiti | REQ-13 | STG | DA ESEGUIRE |
| T-34 | SQL injection su endpoint (query parametrizzate) | REQ-13 | AUTO/PENT | DA ESEGUIRE |
| T-35 | Enumerazione utenti/ordini | REQ-02 | STG/PENT | DA ESEGUIRE |
| T-36 | DoS: payload grandi, loop import, paginazione | REQ-07 | STG/PENT | DA ESEGUIRE |

---

## 2. Dettaglio test prioritari

### T-01 — Manipolazione prezzo/quantità (REQ-01)
- **Scenario**: inviare `POST /api/stripe/checkout` con `items:[{id:1, price:0.01, title:'x', quantity:1}]` e `shipping:0`.
- **Atteso post-fix**: il prezzo in sessione Stripe deriva dal DB; quantità limitata allo stock; titoli dal DB.
- **Evidenza**: JSON sessione Stripe (`amount_total`), risposta.
- **Verdetto**: da valutare in Fase B.

### T-02 — BOLA `/api/stripe/order` (REQ-02)
- **Scenario**: `GET /api/stripe/order?session_id=<sessione di un altro utente>` e `?session_id=<inesistente>` e `?session_id=<non pagata>`.
- **Atteso post-fix**: 404/400, nessun dato restituito; email mascherata.
- **Evidenza**: status code, body.

### T-03/T-05 — Webhook firma e duplicati (REQ-06)
- **Scenario**: payload firmato male (300), doppio POST della stessa `checkout.session.completed` (200, ordine unico), POST concorrenti.
- **Atteso post-fix**: UNIQUE constraint evita duplicati; stock decrementato una volta.
- **Nota**: per il test concorrente serve uno script che invii N richieste simultanee.

### T-09 — Sessione dashboard (REQ-05)
- **Scenario**: login → rimozione email da `DASHBOARD_GOOGLE_EMAILS` → riuso del cookie.
- **Atteso post-fix**: la richiesta fallisce (riverifica allowlist + revoca server-side).
- **Evidenza**: risposta della Server Action.

### T-10 — SQL runner (REQ-05)
- **Casi**: `SELECT pg_sleep(10)`, `WITH x AS (DELETE FROM ...) SELECT`, multi-statement, `SELECT nextval(...)`, `SELECT * FROM users`, query > 10s.
- **Atteso post-fix**: bloccati/troncati; timeout.

### T-14 — Header di sicurezza (REQ-08)
- `curl -I https://darkcardcollection.com` e `/admin`: verificare HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- **Atteso post-fix**: HSTS presente.

### T-16 — SSRF proxy (REQ-09)
- `?url=https://product-images.s3.cardmarket.com/x` con redirect 302 verso `http://169.254.169.254/latest/meta-data/` e `http://localhost:5432`.
- **Atteso post-fix**: bloccato (redirect manual + allowlist finale).

### T-21/T-22 — Access control Payload (REQ-13)
- **Casi**: GET/POST/PATCH/DELETE anonimo su `/api/products`, `/api/orders`, `/api/users`, `/api/messages`, `/api/media`; `POST /api/users/first-register` e `/api/users/register`.
- **Atteso post-fix**: deny anonimo ovunque tranne read products/categories/collections (se richiesto); nessun register pubblico.

### T-26 — Dipendenze (REQ-03)
- `pnpm audit --prod` → 0 High/Critical; `osv-scanner` pulito (o eccezioni documentate).

---

## 3. Test per fasi e responsabilità

| Ambiente | Test | Responsabile |
|---|---|---|
| CI (automatico) | T-01, T-09, T-10, T-11, T-12, T-19, T-21, T-22, T-26, T-31, T-32, T-34 (parz.), T-03 | Dev/CI |
| Staging | T-01..T-25 (manuali + automatici) | Security engineer |
| Produzione (solo con autorizzazione) | T-14, T-25 (restore test), T-27 | Owner + security |
| Penetration test esterno | T-02, T-04, T-15, T-16, T-23, T-28, T-29, T-30, T-35, T-36, T-34 | Pentester autorizzato |

---

## 4. Strumenti da integrare (proposta)
- SAST: `semgrep` o `eslint-plugin-security` (JS/TS) in CI.
- Dependency: `pnpm audit` + `osv-scanner` in CI; Dependabot.
- Secret: `gitleaks` in CI.
- Container: n/a (serverless) — applicabile solo a immagini locali.
- DAST: `zap`/`nuclei` in staging.
- SBOM: `syft`/`trivy` (output in CI artifact).
- Security headers/scan: `securityheaders.com` manuale + test T-14.
