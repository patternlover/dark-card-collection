# ATTACK_SURFACE.md — Dark Card Collection

Stato: **bozza iniziale (Fase A)**.
Superficie d'attacco del progetto, endpooint per endpoint, con autenticazione e controllo autorizzativo richiesti/rilevati.

---

## 1. Endpoint pubblici (nessuna autenticazione)

| Endpoint | Metodo | Scopo | Controlli rilevati | Rischi |
|---|---|---|---|---|
| `/api/stripe/checkout` | POST | Crea sessione Stripe embedded | **nessuna validazione server-side di prezzi/quantità/titoli** | **CRITICO: manipolazione prezzo/q.tà/totale, creazione sessioni abusiva, nessun rate limit** |
| `/api/stripe/order?session_id=` | GET | Mostra riepilogo ordine su pagina success | **nessuna auth, nessun check ownership, nessuna verifica Stripe** | **CRITICO: BOLA/IDOR — lettura di email, item e totali di ordini altrui** |
| `/api/contact` | POST | Form contatto | validazione campi base | spam/DoS DB (no rate limit, no limiti lunghezza) |
| `/api/proxy-image?url=` | GET | Proxy immagini Cardmarket | allowlist host | redirect-following (SSRF-lite), nessun limite dimensione, `Access-Control-Allow-Origin: *` |
| `/api/products`, `/api/categories`, `/api/collections` (REST Payload) | GET | Lettura storefront | access control Payload default = richiede utente autenticato | da verificare con test (potrebbe bloccare anche gli usi legittimi o, se mal configurato, esporre dati) |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/llms.txt`, `/security.txt` (vuoto) | GET | SEO/meta | — | basso |

## 2. Endpoint autenticati

| Endpoint | Metodo | Meccanismo | Controlli rilevati | Rischi |
|---|---|---|---|---|
| `/admin/*` (Payload UI) | GET/POST | Payload local auth (email+password) | default Payload | brute force login (no MFA, no rate limit visibile), account admin unico |
| `/api/auth/google` | GET | — | state cookie (HMAC non richiesto, random 24 byte) | basso |
| `/api/auth/google/callback` | GET | OAuth code + state | verifica state, id_token audience, allowlist email | confronto state con `!==` (timing), token non revocabile, sessione non legata a verifica allowlist a ogni richiesta |
| `/api/admin/products` | GET | header `x-sync-password` vs `SYNC_PASSWORD` o `PAYLOAD_SECRET` | presente | **password statica condivisa**, confronto non constant-time, `PAYLOAD_SECRET` usato come auth API, nessun audit, nessun MFA |
| `/api/admin/products/[id]` | PATCH/DELETE | idem | idem + allowlist campi aggiornabili | stesso + scrittura Google Sheets, cancellazione dati |
| `/api/admin/backfill-images` | GET | `?secret=` o `Authorization: Bearer` vs `CRON_SECRET`/`PAYLOAD_SECRET` | presente | secret in query string (log/referrer), `PAYLOAD_SECRET` riusato |
| `/api/cron/import` | GET | `Authorization: Bearer CRON_SECRET`/`PAYLOAD_SECRET` | presente | SSRF via `image_url` del foglio, dipendenza da sheet pubblico, no rate limit |
| `/api/cron/prices` | GET | idem | presente | — |
| `/api/products/import` | POST | `Authorization: Bearer PAYLOAD_SECRET` | presente | segreti in header ok, ma riuso del secret CMS |

## 3. Server Actions (dashboard)

| Azione | Autenticazione | Permessi | Rischi |
|---|---|---|---|
| `getOverview`, `searchProducts`, `getOrders`, `updateProduct`, `updateOrderStatus`, `deleteProduct`, `logout` | cookie `dcc-dash` firmato HMAC-SHA256 (TTL 7gg) | completo accesso ai dati store | sessione non revocabile, email allowlist non riverificata |
| `runQuery(sql)` | idem | SQL arbitrario read-only su **tutte le tabelle** | lettura `users` (hash password), `orders`, `messages`; `SELECT pg_sleep()`/`nextval()`/`setval()` per DoS o side-effect; nessun resource limit |

## 4. API Payload REST esposta (`/api/{collection}`)

Route catch-all `src/app/(payload)/api/[...slug]/route.ts`. GraphQL **non** abilitato (nessun plugin `@payloadcms/graphql`).
Access control: default Payload 3 = richiede utente autenticato per tutte le operazioni. Da **testare** (VULN-verifica): non definire `access` in nessuna collection significa che eventuali endpoint pubblici legittimi non sono configurabili e che la semantica dipende dal default. **Raccomandazione**: definire esplicitamente access control per ogni collection (deny by default), disabilitare `register`/`first-register` e limitare login.

## 5. Infrastruttura / rete

- DB PostgreSQL: **da verificare** che non sia esposto pubblicamente; connessione TLS obbligatoria.
- Vercel Blob: bucket con token read-write in produzione.
- Vercel Cron: due job (`/api/cron/import`, `/api/cron/prices`).
- Domain: `darkcardcollection.com`, TLS gestito da Vercel; **HSTS assente**.
- GitHub: `main` branch; nessuna branch protection verificabile dal repo.

## 6. Superficie client

- `localStorage`: `dcc-cart` (carrello, **contiene prezzi** → manipolabile), `dcc-cookie-consent`.
- `sessionStorage`: `dcc-purchase-tracked`.
- Cookie: `dcc-dash` (sessione dashboard), `dcc-oauth-state`, `payload-*` (session Payload).
- Script di terze parti: Stripe JS, GTM (solo con consenso analytics). CSP con `'unsafe-inline'/'unsafe-eval'`.
- Immagini proxy: `src/lib/proxy-image.ts` limita ai domini Cardmarket.

## 7. Matrice di rischio per superficie (sintesi)

| Superficie | Probabilità | Impatto | Rischio |
|---|---|---|---|
| Checkout (prezzo/q.tà) | alta | alto | **Critico** |
| `/api/stripe/order` BOLA | media | alto | **Critico** |
| Dipendenze Next/sharp (CVE) | alta | medio-alto | **Alto** |
| Password admin statica | media | alto | **Alto** |
| Sessione dashboard non revocabile + SQL runner | media | alto | **Alto** |
| Overselling / nessun decremento stock | media | medio | **Alto** |
| Webhook non idempotente | media | medio | **Alto** |
| No rate limiting | alta | medio | **Alto** |
| CSP permissivo | media | medio | Medio |
| proxy-image SSRF-lite / no limiti | media | medio | Medio |
| Sheet pubblico (costi acquisto) | media | medio | Medio |
| Errori che esponono dettagli | media | basso | Medio |
| No HSTS | bassa | medio | Medio |
