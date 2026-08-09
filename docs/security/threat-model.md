# Threat Model — Dark Card Collection

Stato: **bozza iniziale (Fase A)**.
Metodologie: STRIDE, OWASP ASVS 5.0, OWASP Top 10:2025, principio del minimo privilegio, defense-in-depth, Zero Trust.
Livelli rischio: `C` = Critical, `H` = High, `M` = Medium, `L` = Low.

---

## 1. Premesse e assunzioni

- Attaccanti considerati: clienti anonimi, attaccanti esterni, utenti con accesso admin (dashboard/CMS) di livello basso, insider con accesso repo/CI, supply chain.
- L'applicazione è monolitica Next.js su Vercel; DB gestito esternamente (provider non verificato). Presenza di due pannelli admin + un pannello prodotti a password statica.
- Il carrello vive in `localStorage` ed è **non attendibile**.

---

## 2. Registro minacce (STRIDE + OWASP)

### T01 — Manipolazione prezzo/quantità al checkout (Business Logic / Integrity)
- **Asset**: importo ordine, incasso aziendale.
- **Componente**: `src/app/api/stripe/checkout/route.ts`, `src/hooks/useCart.tsx`, `src/app/checkout/page.tsx`.
- **Attore**: cliente anonimo.
- **Vettore**: modifica del payload `items[{id,title,price,quantity}]` / `shipping` inviato al POST `/api/stripe/checkout` (devtools, proxy).
- **Probabilità**: alta. **Impatto**: alto. **Rischio**: **C**.
- **Preventivo**: calcolo prezzi/totale **esclusivamente lato server** a partire dagli `id` prodotto (Local API), ignorando prezzi/titoli del client; validazione quantità (1..stock), limite item; verifica dello stato prodotto.
- **Detective**: audit log delle sessioni checkout con importo server-side calcolato; alert su importo ≠ totale atteso.
- **Risposta**: disattivazione checkout, analisi sessioni Stripe, refund.
- **Test**: manipolare payload in staging e verificare che l'importo in Stripe sia quello del DB.
- **Residuo**: eventuali errori di mapping prodotto→prezzo (da coprire con test di regressione).

### T02 — BOLA/IDOR su ordine (`/api/stripe/order`)
- **Asset**: dati ordine (email, items, totali).
- **Componente**: `src/app/api/stripe/order/route.ts`, `src/app/checkout/success/page.tsx`.
- **Attore**: utente anonimo con `session_id` altrui.
- **Vettore**: GET `/api/stripe/order?session_id=cs_live_...` senza autenticazione; l'endpoint interroga il DB e restituisce dati.
- **Probabilità**: media. **Impatto**: alto (PII). **Rischio**: **C**.
- **Preventivo**: non accettare `session_id` non verificato; verificare con Stripe (`checkout.sessions.retrieve`) che la sessione esista, sia `paid`/completa e appartenga al richiedente (es. legame a cookie `idempotency`/`client_reference_id`); non restituire email completa; autenticazione o token usa-e-getta legato alla sessione.
- **Detective**: log accessi all'endpoint con sessione non valida; alert su 4xx anomali.
- **Risposta**: revoca/oscuramento endpoint, notifica, analisi log.
- **Test**: sessione altrui/inesistente/non pagata; enumerazione session_id.
- **Residuo**: se non si aggiunge auth, il leak resta; mitigazione minima = verifica Stripe server-side + riduzione campi esposti.

### T03 — Vulnerabilità note dipendenze (Next.js, sharp, fast-uri, dompurify)
- **Asset**: runtime, dati.
- **Componente**: `next 15.4.11`, `sharp 0.34.2`, `fast-uri`, `dompurify` (transitiva via Payload/Monaco).
- **Attore**: remoto.
- **Vettore**: exploit di CVE note (DoS Server Components, SSRF via WebSocket, middleware bypass, Server Actions DoS, CVE libvips, host confusion).
- **Probabilità**: alta. **Impatto**: medio-alto. **Rischio**: **H**.
- **Preventivo**: upgrade a `next >= 15.5.21`, `sharp >= 0.35.0`, `fast-uri >= 3.1.4`; `pnpm audit` in CI; lockfile.
- **Detective**: dependency scanning in CI (blocco su Critical/High non accettati).
- **Risposta**: hotfix/patch urgente, redeploy.
- **Test**: `pnpm audit --prod`; test funzionali post-upgrade.
- **Residuo**: vulnerabilità di dipendenze non ancora note (0-day).

### T04 — Credenziali/secret amministrative deboli e condivise
- **Asset**: API admin, dati, Sheets.
- **Componente**: `src/app/api/admin/products/*`, `src/app/api/admin/backfill-images/route.ts`, `src/app/admin/products/page.tsx`, `.env.*`.
- **Attore**: insider, attaccante con `SYNC_PASSWORD`/`PAYLOAD_SECRET`.
- **Vettore**: password statica condivisa in header `x-sync-password`; confronti non constant-time; `PAYLOAD_SECRET` riusato come bearer token API; secret in query string (`backfill-images?secret=`).
- **Probabilità**: media. **Impatto**: alto. **Rischio**: **H**.
- **Preventivo**: rimuovere riuso di `PAYLOAD_SECRET`; secret dedicati (cron/admin) con rotazione; comparison constant-time (`timingSafeEqual`); niente secret in query string; integrare la gestione prodotti nel dashboard OAuth con RBAC e MFA.
- **Detective**: audit log di ogni mutazione admin con `actor`; alert su uso di password condivisa; secret scanning.
- **Risposta**: rotazione immediata dei secret, revoca sessioni, analisi delle modifiche (Products/Orders).
- **Test**: tentare accessi con password errata, timing test, verifica assenza secret in query/log.
- **Residuo**: dipendenza dalla disciplina di rotazione.

### T05 — Sessioni dashboard non revocabili + SQL runner (eccesso di privilegio)
- **Asset**: intero DB, sessioni admin.
- **Componente**: `src/lib/dash-auth.ts`, `src/app/dashboard/actions.ts`, `src/lib/db-query.ts`.
- **Attore**: admin legittimo licenziato, attaccante con cookie `dcc-dash`.
- **Vettore**: cookie bearer valido 7gg, non revocabile; `runQuery` permette `SELECT` su tutte le tabelle (incluso `users` hash) e funzioni con side-effect (`pg_sleep`, `nextval`).
- **Probabilità**: media. **Impatto**: alto. **Rischio**: **H**.
- **Preventivo**: sessione server-side revocabile (store su DB/Redis), riverifica allowlist email a ogni richiesta, scadenza più breve + inattività, MFA; limitare `runQuery` a una lista di tabelle/read-only con blocco di funzioni (`pg_sleep`, sequenze), timeout e `statement_timeout`.
- **Detective**: audit login/logout, alert su sessioni attive multiple, monitoraggio query SQL eseguite.
- **Risposta**: invalidazione di tutte le sessioni (rotazione `PAYLOAD_SECRET` o versione sessione), analisi query loggate.
- **Test**: login con email rimossa dall'allowlist (deve fallire subito), query con `pg_sleep` (bloccata), lettura `users` (decidere se consentita).
- **Residuo**: il runner SQL, anche se ristretto, resta ad alto privilegio per un admin.

### T06 — Overselling / nessun decremento stock
- **Asset**: inventario, ordini.
- **Componente**: `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`.
- **Attore**: cliente.
- **Vettore**: acquisto di quantità > stock; ordini creati senza decrementare `products.quantity`.
- **Probabilità**: media. **Impatto**: medio. **Rischio**: **H**.
- **Preventivo**: check stock server-side al checkout e decremento atomico alla conferma webhook (transazione); reinserimento stock in caso di refund/cancellazione.
- **Detective**: monitoraggio stock vs ordini pagati; alert su discrepanze.
- **Risposta**: correzione manuale stock, refund parziale.
- **Test**: acquisto di più pezzi dello stock; doppio acquisto simultaneo (race).
- **Residuo**: gestione manuale dello stock se parte di essa è offline.

### T07 — Webhook non idempotente e validazione incompleta
- **Asset**: ordini, email.
- **Componente**: `src/app/api/stripe/webhook/route.ts`.
- **Attore**: attaccante che replica eventi (già firmati correttamente solo da Stripe) / Stripe stesso su retry.
- **Vettore**: doppia consegna `checkout.session.completed` (TOCTOU: il check "esiste già" non è atomico) → ordini duplicati; mancato check `currency === 'eur'`; mancata gestione refund/dispute; eventi fuori ordine.
- **Probabilità**: media. **Impatto**: medio. **Rischio**: **H**.
- **Preventivo**: vincolo UNIQUE su `orders.stripeSessionId` + insert con gestione conflitto; verificare `session.currency`, `session.payment_status === 'paid'`, `session.amount_total`; usare `idempotency` key; gestire `checkout.session.async_payment_succeeded`, `charge.refunded`, `payment_intent.payment_failed`.
- **Detective**: log eventi webhook con `event.id`, alert su errori/duplicati.
- **Risposta**: deduplica, correzione ordini, analisi.
- **Test**: replay, doppio invio, importo/valuta diversi, ordine già esistente (vedi [`test-plan.md`](./test-plan.md)).
- **Residuo**: eventi di tipo non gestito (default log) non processati.

### T08 — Assenza di rate limiting e anti-abuso
- **Asset**: disponibilità, dati.
- **Componente**: `/api/stripe/checkout`, `/api/contact`, `/api/proxy-image`, auth Payload, dashboard.
- **Attore**: attaccante remoto.
- **Vettore**: brute force login, credential stuffing, spam contatto, abuso sessione checkout, scraping, DoS su proxy.
- **Probabilità**: alta. **Impatto**: medio. **Rischio**: **H**.
- **Preventivo**: rate limiting (IP + account) su auth, contact, checkout; limiti dimensione payload; timeout; WAF/edge (Vercel + provider).
- **Detective**: alert su rate-limit superati, tentativi login falliti, picchi 4xx/5xx.
- **Risposta**: ban IP temporaneo, throttling.
- **Test**: flood su endpoint in staging.
- **Residuo**: protezione edge dipendente da provider.

### T09 — CSP permissiva (XSS mitigazione debole)
- **Asset**: client, sessioni.
- **Componente**: `next.config.ts` CSP, pagine React.
- **Attore**: attaccante remoto (iniezione contenuti).
- **Vettore**: XSS (stored/reflected/DOM) favorito da `script-src 'unsafe-inline' 'unsafe-eval'`.
- **Probabilità**: media. **Impatto**: medio. **Rischio**: **M**.
- **Preventivo**: rimuovere `'unsafe-inline'`/`'unsafe-eval'` dove possibile (valutare compatibilità Payload/Stripe/GTM); hashes per script inline; output escaping in tutto il codice React; sanitizzazione HTML non utilizzata.
- **Detective**: alert su errori CSP nel browser (report-to), scan DAST.
- **Risposta**: hotfix, rotazione sessioni coinvolte.
- **Test**: test XSS automatico + manuale; verifica CSP con browser.
- **Residuo**: Payload admin potrebbe richiedere eval in dev; in prod da valutare.

### T10 — SSRF / proxying non vincolato
- **Asset**: rete interna, memorie.
- **Componente**: `src/app/api/proxy-image/route.ts` (redirect-following), `src/lib/image-import.ts` (URL dal foglio).
- **Attore**: utente anonimo (proxy), chi può editare il Google Sheet (import).
- **Vettore**: `url` di redirect verso host interni/metadata; `image_url` malevolo nel foglio; immagini bomba (decompression) senza limiti dimensione.
- **Probabilità**: media. **Impatto**: medio. **Rischio**: **M**.
- **Preventivo**: `redirect: 'manual'` + validate URL finale; limiti dimensione/conteggio immagini; verifica content-type (`image/*`); allowlist stringente; nel foglio, firma/allowlist URL accettati.
- **Detective**: log URL richiesti, alert su host inattesi.
- **Risposta**: disabilitazione proxy, rimozione URL malevoli.
- **Test**: redirect verso `169.254.169.254`/`localhost`, immagine > 5MB.
- **Residuo**: il foglio pubblico resta sorgente non trusted per dati.

### T11 — Esposizione dati via Google Sheets pubblici
- **Asset**: costi acquisto, storico vendite.
- **Componente**: `src/app/api/cron/*`, `src/app/api/products/import/route.ts` (URL `gviz` hardcoded).
- **Attore**: chiunque conosca l'URL (pubblico se sharing pubblico).
- **Vettore**: lettura diretta CSV.
- **Probabilità**: media. **Impatto**: medio. **Rischio**: **M**.
- **Preventivo**: servire i dati solo tramite API del service account (con scope minimi) o rendere il foglio privato con accesso del SA; non hardcodare URL pubblici.
- **Detective**: audit accessi foglio (Google Workspace audit).
- **Risposta**: cambio permessi foglio, rotazione SA.
- **Test**: aprire l'URL gviz anonimamente.
- **Residuo**: se il business richiede condivisione con terzi, il rischio resta.

### T12 — Info disclosure negli errori
- **Asset**: dettagli interni.
- **Componente**: `String(error)` in `/api/admin/products`, `/api/cron/*`, `/api/products/import`, `alert(String(err))` nel client.
- **Attore**: utente anonimo.
- **Vettore**: richieste malformate che fanno fallire il try/catch e restituiscono il messaggio d'errore.
- **Probabilità**: media. **Impatto**: basso. **Rischio**: **M**.
- **Preventivo**: errori generici verso il client; log dettagliato solo server-side; `NODE_ENV=production` (Next già lo gestisce per errori di pagina).
- **Detective**: scanning per pattern di errore interni.
- **Risposta**: correzione handler.
- **Test**: invio payload invalidi e verifica risposta.
- **Residuo**: basso.

### T13 — Autenticazione CMS (brute force, account takeover)
- **Asset**: account admin Payload.
- **Componente**: `src/payload/collections/Users`, `/admin`.
- **Attore**: remoto.
- **Vettore**: brute force/credential stuffing su login Payload (Payload ha lockout `login_attempts`, ma senza MFA/rate limit edge).
- **Probabilità**: media. **Impatto**: alto. **Rischio**: **M** (mitigato in parte da lockout interno).
- **Preventivo**: MFA, rate limiting, password policy forte, email allowlist per admin, audit login.
- **Detective**: alert su tentativi falliti, accessi admin anomali.
- **Risposta**: blocco account, rotazione password/secret.
- **Test**: brute force simulato in staging.
- **Residuo**: dipende dal deployment (provider rate limit).

### T14 — Supply chain / codice generato da AI
- **Asset**: pipeline, build.
- **Componente**: `.github/workflows/ci.yml`, `pnpm-lock.yaml`, `onlyBuiltDependencies` (sharp, esbuild, unrs-resolver).
- **Attore**: attaccante che compromette un pacchetto/action.
- **Vettore**: dipendenze compromise, action non pinnate (`@v4` è immutabile per tag, ma le action possono essere modificate), script post-install.
- **Probabilità**: bassa-media. **Impatto**: alto. **Rischio**: **M**.
- **Preventivo**: pin SHA delle action, `lockfile` verificato, `pnpm audit`/OSV in CI, verifica integrità, SBOM; revisione del codice generato da AI (audit umano).
- **Detective**: dependency scanning, Dependabot/renovate.
- **Risposta**: rollback build, rotazione credenziali, contenimento runner.
- **Test**: `pnpm audit`, `osv-scanner`.
- **Residuo**: 0-day di supply chain non prevedibili.

### T15 — XSS / CSRF / clickjacking / open redirect (residuali)
- **Componente**: pagine React, `JsonLd`, form contatto, redirect OAuth, admin.
- **Vettori**: XSS tramite contenuti (titoli prodotto dal foglio, messaggi contatto visualizzati in admin), CSRF (assente: le mutazioni sono JSON/POST non form-based; dashboard usa cookie SameSite=Lax), clickjacking (mitigato da X-Frame-Options + frame-ancestors), open redirect (i redirect sono hardcoded verso `NEXT_PUBLIC_SITE_URL`).
- **Probabilità**: bassa. **Impatto**: medio. **Rischio**: **L**.
- **Preventivo**: escaping React (default), CSP, SameSite=Lax, header anti-frame.
- **Detective**: scan DAST.
- **Test**: XSS payload in titoli/messaggi, redirect manipulation.
- **Residuo**: basso (verificare rendering in admin di `Messages`).

### T16 — Logging insufficiente (niente audit)
- **Asset**: capacità di rilevare incidenti.
- **Componente**: tutto.
- **Vettore**: operazioni malevole non rilevabili (modifica prezzi, refund, export, login).
- **Probabilità**: —. **Impatto**: medio. **Rischio**: **M**.
- **Preventivo**: audit log strutturato (actor, azione, risorsa, timestamp, request id), correlation id, log di webhook eventi.
- **Detective**: alert su eventi sensibili.
- **Risposta**: investigazione basata su audit.
- **Test**: verificare che gli eventi critici siano loggati e che i log non contengano secret.
- **Residuo**: storico incompleto fino a quando non è implementato.

---

## 3. Copertura minacce richieste dal piano (checklist)

| Minaccia | Riferimento | Stato |
|---|---|---|
| Broken Access Control / IDOR / BOLA | T02 | A rischio (endpoint order) |
| Privilege escalation | T05, T08 | Dashboard admin unico; no escalation utenti |
| Account takeover | T13, T01 | Rischio brute force senza MFA |
| Credential stuffing / brute force | T13, T08 | Nessun rate limit edge |
| Session hijacking / fixation | T05 | Cookie HttpOnly+Secure; sessione non revocabile |
| Autenticazione debole | T13 | Password admin CMS; OAuth admin ok |
| SQL injection | — | Payload parametrizza; runner SQL è read-only ma libero (T05) |
| XSS stored/reflected/DOM | T09, T15 | CSP permissiva; da testare |
| CSRF | T15 | Rischio basso (SameSite Lax) |
| SSRF | T10 | proxy + image import |
| RCE / command injection / path traversal | — | Non rilevati nel codice (immagini via sharp, no shell); da verificare con scan |
| Mass assignment / prototype pollution | T01 (fields), — | Checkout accetta campi liberi; admin products ha allowlist ✓ |
| File upload malevolo | — | Media via Payload/Vercel Blob: validazione mime di Payload; da testare |
| Open redirect | T15 | Rischio basso (redirect hardcoded) |
| CORS / clickjacking / HTTP smuggling | T15, T09 | CORS assente (stesso origin); header anti-frame ✓ |
| Race condition | T07 | Webhook/stock non atomici |
| Business logic abuse / prezzi / q.tà / sconti / coupon | T01 | Prezzi fidati dal client → **critico** |
| Frodi rimborsi / doppia elaborazione | T07 | Refund non gestiti |
| Replay richieste | T07 | Webhook replay non gestito a livello idempotenza |
| Falsificazione webhook | T07 | Firma verificata ✓ |
| Abuso API / scraping / DoS | T08 | No rate limit |
| Data/secret leakage | T02, T11, T04 | Rischi attivi |
| Supply chain / dipendenze compromesse | T03, T14 | CVE attive in Next/sharp |
| Container / cloud misconfiguration | T03, infra | Su Vercel; verifica permessi token |
| Accesso non autorizzato al DB | T05, infra | Runner SQL + URI DB; rete da verificare |
| Cancellazione dati / compromissione backup | T04, infra | No backup config verificato |
| Vulnerabilità codice AI | T14 | Audit mancante |

---

## 4. Priorità di remediation (sintesi)

1. **C** T01 — prezzo server-side al checkout.
2. **C** T02 — protezione `/api/stripe/order`.
3. **H** T03 — upgrade Next.js/sharp/fast-uri + audit in CI.
4. **H** T04 — secret dedicati + rotazione + constant-time + no PAYLOAD_SECRET nelle API.
5. **H** T05 — sessione revocabile + limitazione SQL runner.
6. **H** T06/T07 — stock atomico + idempotenza webhook + validazioni.
7. **H** T08 — rate limiting.
8. **M** T09–T12 — CSP, proxy, sheet, errori.
9. **M** T16 — audit logging.
10. **L** T13–T15 — MFA, hardening residuo.
