# SECURITY_REQUIREMENTS.md — Dark Card Collection

Stato: **bozza iniziale (Fase A)**.
Lista prioritaria dei rischi + requisiti di sicurezza derivati (controlli e test obbligatori). Ogni requisito ha ID, severità e criterio di accettazione. Aggiornare in Fase B quando un requisito viene implementato.

---

## 1. Rischi prioritari e requisiti

### REQ-01 [Critical] — Prezzi e totali calcolati lato server al checkout
**Rischio**: manipolazione prezzi/quantità/sconti via payload client.
**Controlli**:
- `POST /api/stripe/checkout` accetta solo `items[{id, quantity}]` (e niente `price`, `title`, `shipping` fidati).
- Il server risolve ogni `id` prodotto via Local API, verifica `status` (`listed`/`hold`), `isVisible`, `quantity` disponibile, calcola `unit_amount` dal `storePrice` del DB e calcola spedizione (gratis ≥80€, 9.99€ altrimenti).
- Limiti: max item per sessione (es. 20), quantity 1..stock, quantità intere positive.
- Errori generici, nessun dettaglio interno.
**Test**: manipolazione payload (prezzo 0.01, negativo, q.tà 999, titolo XSS), verifica importo su sessione Stripe.
**Criterio di accettazione**: l'importo in Stripe deriva esclusivamente dal DB.

### REQ-02 [Critical] — `/api/stripe/order` senza BOLA e senza leak PII
**Controlli**:
- Verificare lato server la sessione con `stripe.checkout.sessions.retrieve(sessionId)`; rispondere 404/400 se non `payment_status === 'paid'` o se la sessione non corrisponde all'utente richiedente.
- Non esporre l'email completa (mascherare) e non esporre dati non necessari.
- Opzionale: legare il successo a un token monouso emesso dal backend (cookie HttpOnly) al momento della creazione sessione.
**Test**: session_id altrui/inesistente/non pagato, enumerazione, replay.
**Criterio di accettazione**: un utente non può leggere dati di ordini altrui.

### REQ-03 [High] — Dipendenze senza CVE note (supply chain)
**Controlli**:
- Upgrade `next` → `>=15.5.21`, `sharp` → `>=0.35.0`, `fast-uri` → `>=3.1.4`; ripetere `pnpm audit --prod` fino a 0 High su runtime.
- Aggiungere in CI: `pnpm audit --prod` e `osv-scanner` (o Snyk/Trivy), blocco su Critical/High non accettati.
**Test**: `pnpm audit` verde; build e test funzionali (checkout, admin, import) post-upgrade.
**Criterio di accettazione**: nessuna vulnerabilità High/Critical non accettata sulle dipendenze runtime.

### REQ-04 [High] — Secret amministrativi dedicati e confronti sicuri
**Controlli**:
- Rimuovere l'uso di `PAYLOAD_SECRET` come bearer token per cron/admin API; introdurre secret dedicati (`CRON_SECRET`, `SYNC_PASSWORD` → sostituire con auth dashboard OAuth o secret per-endpoint con rotazione).
- Confronto secret con `crypto.timingSafeEqual` (lunghezze uguali prima).
- Rimuovere il passaggio di secret in query string (`backfill-images?secret=`): accettare solo `Authorization: Bearer`.
- Procedura di rotazione documentata in SECRETS_MANAGEMENT.md (inclusa l'invalidazione delle sessioni dashboard via `PAYLOAD_SECRET`).
**Test**: verifica che nessun endpoint accetti `PAYLOAD_SECRET` come credenziale; timing test.
**Criterio di accettazione**: nessun riuso di `PAYLOAD_SECRET` in API; nessun secret in URL.

### REQ-05 [High] — Sessione dashboard revocabile e SQL runner limitato
**Controlli**:
- Sessione server-side (tabella `admin_sessions` o equivalente) con id random, TTL ridotto (es. 12h) + inactivity timeout; logout che invalida sul server; riverifica della allowlist email a ogni richiesta autenticata.
- `runQuery`: whitelist tabelle, blocco di `pg_sleep`/`nextval`/`setval`/`lo_*`, `statement_timeout` (es. 10s), max righe già presente (500).
**Test**: login → rimozione email dall'allowlist → la richiesta successiva fallisce; `SELECT pg_sleep(10)` bloccata.
**Criterio di accettazione**: revoca immediata e riduzione superficie del runner.

### REQ-06 [High] — Ordini idempotenti e stock corretto
**Controlli**:
- Vincolo UNIQUE su `orders.stripeSessionId` (migration reversibile) + insert con gestione conflitto nel webhook.
- Webhook: verifica `session.currency === 'eur'`, `payment_status === 'paid'`, importo coerente; decremento stock atomico (transazione) per ogni item; gestione `charge.refunded`/`payment_intent.payment_failed` con ripristino stock.
**Test**: webhook duplicato/concorrente, valuta diversa, refund.
**Criterio di accettazione**: mai ordini duplicati; stock coerente con ordini pagati.

### REQ-07 [High] — Rate limiting e protezioni anti-abuso
**Controlli**:
- Rate limit su: login Payload, `/api/contact`, `/api/stripe/checkout`, `/api/proxy-image` (IP + endpoint).
- Limiti payload (dimensione body, numero item, lunghezza campi), timeout.
**Test**: flood in staging; verifica risposta 429.
**Criterio di accettazione**: endpoint sensibili limitati per IP/account.

### REQ-08 [Medium] — Header di sicurezza completi
**Controlli**:
- Aggiungere `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Valutare rimozione di `'unsafe-inline'/'unsafe-eval'` da `script-src` (o passaggio a hashes) compatibilmente con Payload/Stripe/GTM.
**Test**: `curl -I` e test browser; check header.
**Criterio di accettazione**: HSTS presente; CSP senza `'unsafe-eval'` in produzione se fattibile.

### REQ-09 [Medium] — Proxy immagini e import hardening
**Controlli**:
- `fetch(..., { redirect: 'manual' })` e convalida del redirect finale contro l'allowlist.
- Limite dimensione download (es. 5MB) e conteggio immagini per import.
- Verifica `content-type` `image/*` (e non `text/html`, `image/svg+xml` non necessario).
**Test**: redirect a localhost/metadata; immagine bomba.
**Criterio di accettazione**: nessuna risposta oltre i limiti; nessun host fuori allowlist.

### REQ-10 [Medium] — Feed Google Sheets non esposto pubblicamente
**Controlli**:
- Utilizzare l'API del service account (scope minimi, es. `spreadsheets.readonly` per import + `spreadsheets` per updateRow) invece degli URL `gviz` pubblici; o rendere i fogli privati con accesso solo al SA.
**Test**: accesso anonimo all'URL → 403/errore.
**Criterio di accettazione**: dati (costi acquisto, vendite) non leggibili anonimamente.

### REQ-11 [Medium] — Errori generici e no stack trace verso il client
**Controlli**:
- Sostituire `String(error)`/`details` con messaggi generici; log dettagliato solo server-side.
**Test**: payload malformati → nessun dettaglio interno nella risposta.
**Criterio di accettazione**: nessuna fuga di dettagli interni nelle risposte HTTP.

### REQ-12 [Medium] — Audit logging strutturato
**Controlli**:
- Eventi da loggare: login/logout admin, modifiche prezzo/prodotto, cambi stato ordine, refund, export, webhook (evento, id, esito), rate-limit superati, errori 4xx/5xx anomali.
- Request ID + correlation ID; mai loggare secret/token/session ID/carte.
**Test**: verificare presenza e assenza di dati vietati nei log.
**Criterio di accettazione**: audit log consultabile e privo di dati sensibili.

### REQ-13 [Medium] — Access control Payload esplicito e deny-by-default
**Controlli**:
- Definire `access` per ogni collection (deny by default; `read` anonimo solo per products/categories/collections filtrate; nessuna operazione write anonima).
- Disabilitare `first-register`/`register` su `users`; rate limit su login.
**Test**: tentare CRUD anonimo e autenticato su ciascuna collection via REST.
**Criterio di accettazione**: nessuna operazione anonima non prevista; nessuna creazione account pubblica.

### REQ-14 [Medium] — MFA per amministratori
**Controlli**:
- MFA (TOTP) per gli account Payload admin e/o abilitare verifica 2FA Google per le email dell'allowlist dashboard.
**Test**: login con TOTP corretto/errato.
**Criterio di accettazione**: nessun admin senza secondo fattore.

### REQ-15 [Low] — Backup e restore verificati
**Controlli**:
- Backup automatici cifrati del DB (provider), retention tecnica, test periodico di restore, documentazione procedura.
**Test**: restore in ambiente di test.
**Criterio di accettazione**: restore riuscito entro RTO definito.

---

## 2. Test obbligatori (mappa)
Vedi SECURITY_TEST_PLAN.md per l'elenco completo. I requisiti REQ-01..REQ-15 hanno test dedicati elencati qui sopra; ogni test ha stato iniziale `DA ESEGUIRE` e viene aggiornato in Fase B.

---

## 3. Divieti operativi (regole del piano)
- Non eseguire modifiche distruttive/invasive in produzione senza approvazione.
- Non cancellare dati.
- Non modificare il DB di produzione senza migration reversibile e rollback.
- Non ruotare credenziali senza documentare prima la procedura (SECRETS_MANAGEMENT.md).
- Non mostrare/inserire segreti nei report.
