# Gestione Segreti — Dark Card Collection

Stato: **bozza iniziale (Fase A)**.
Gestione dei segreti: inventario (senza valori), separazione per ambiente, rotazione, revoca, secret scanning. Nessun valore segreto è riportato in questo documento (regola del piano).

---

## 1. Inventario segreti (variabili d'ambiente)

| Variabile | Tipo | Uso | Ambiente | Sensibilità |
|---|---|---|---|---|
| `PAYLOAD_SECRET` | secret CMS | cifratura sessioni Payload, firma cookie dashboard (`dcc-dash`) | local/prod | **critico** |
| `DATABASE_URI` | conn string | connessione PostgreSQL (contiene credenziali) | local/prod | **critico** |
| `STRIPE_SECRET_KEY` | secret Stripe | operazioni Stripe server-side | local/prod (test/live separate) | **critico** |
| `STRIPE_WEBHOOK_SECRET` | secret webhook | verifica firma webhook | local/prod | **critico** |
| `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | chiave pubblicabile | client Stripe | local/prod | pubblico (di default) |
| `BLOB_READ_WRITE_TOKEN` | token Vercel Blob | upload immagini (read/write) | local/prod | **alto** |
| `RESEND_API_KEY` | API key email | invio email transazionali | local/prod | **alto** |
| `EMAIL_FROM` | indirizzo | mittente email | local/prod | basso |
| `DASH_SESSION_SECRET` | secret | firma HMAC cookie sessione `/dashboard` (fallback: `PAYLOAD_SECRET`) | local/prod | **alto** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth | login dashboard | local/prod | **alto** |
| `GOOGLE_OAUTH_REDIRECT_URI` | URI | callback OAuth | local/prod | basso |
| `DASHBOARD_GOOGLE_EMAILS` | allowlist | autorizzazione dashboard | local/prod | medio |
| `VERCEL_OIDC_TOKEN` | token OIDC | fornito da Vercel (broad) | prod | **alto** |
| `NEXT_PUBLIC_SITE_URL` | URL | URL pubblici | local/prod | pubblico |
| `NEXT_PUBLIC_GTM_ID` | ID | GTM (opzionale) | local/prod | pubblico |

**Stato attuale**: `.env.local` e `.env.prod` esistono in locale con valori reali, **non versionati** (`.gitignore` ✓). Nessun segreto reale è stato trovato nella storia git (solo placeholder del tipo `sk_live_your_key_here` / `sk_live_...`). **Verificare** con `gitleaks` in CI e nella storia git. Dal 2026-08 i segreti Sheets (`GOOGLE_SERVICE_ACCOUNT`, `GOOGLE_SHEET_ID`), `CRON_SECRET` e `SYNC_PASSWORD` sono stati **rimossi** con il flusso legacy.

---

## 2. Regole operative
1. Mai versionare segreti: `.env*` in `.gitignore` (già presente). Aggiungere un commit di pulizia se mai trovati (`git filter-repo`).
2. Secret per ambiente: test/live Stripe separate ✓; staging con chiavi test.
3. Non riusare `PAYLOAD_SECRET` come credenziale API: usare segreti dedicati e a rotazione (dal 2026-08 non restano API bearer: cron/admin rimosse).
4. Mai in: log, errori verso il client, test, bundle client, URL/query string, riferimenti HTTP.
5. Secret scanning in CI (gitleaks) + scansione pre-commit.
6. Accesso minimo: `BLOB_READ_WRITE_TOKEN` → preferire token read-only per il pubblico; ruoli DB senza superuser.

## 3. Procedura di rotazione

### 3.1 `PAYLOAD_SECRET`
**Effetto collaterale**: invalida tutte le sessioni CMS Payload e tutti i cookie dashboard `dcc-dash` (firma HMAC). Pianificare durante una finestra di manutenzione e notificare gli admin.
1. Generare nuovo valore: `openssl rand -base64 48`.
2. Aggiornare su Vercel (Environment Variables → Production/Preview) e nel `.env.local` locale.
3. Redepiegare l'app (le sessioni CMS ripartono; gli admin dovranno ri-loggare).
4. Verificare: login CMS e dashboard ok.
5. Se il vecchio valore è stato esposto: verificare i log e le sessioni attive.

### 3.2 `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
1. Su Stripe Dashboard: creare una nuova chiave segreta limitata (o rigenerare), lasciando attiva la vecchia per il periodo di rollover.
2. Aggiornare env su Vercel e locale; redepiegare.
3. Verificare webhook: inviare un evento di test dal Dashboard → firma valida.
4. Dopo 24-48h senza errori: revocare la chiave precedente su Stripe.
5. Ruotare anche `STRIPE_PUBLISHABLE_KEY` se esposta/compromessa (nessun impatto sul backend).

### 3.3 `DATABASE_URI`
1. Generare nuova password utente DB sul provider; aggiornare il role.
2. Aggiornare `DATABASE_URI` su Vercel e locale; redepiegare.
3. Verificare connessione e migration.
4. Ruotare/revocare la vecchia password dopo la finestra di rollover.
5. Se esposta: verificare i log DB per connessioni non autorizzate, limitare rete, valutare recovery.

### 3.4 `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `DASH_SESSION_SECRET`
1. Generare nuovo valore dal rispettivo provider.
2. Aggiornare env (Vercel + locale); redepiegare.
3. Verificare funzionamento (OAuth, email, blob, sessione dashboard).
4. Revocare il vecchio dopo il rollover.
5. Per `BLOB_READ_WRITE_TOKEN`: se esposto, valutare la migrazione dei blob o la rotazione della policy.

## 4. Revoca rapida (incidenti)
- `PAYLOAD_SECRET` ruotato → tutte le sessioni dashboard/CMS invalidate (se il token è firmato con HMAC del secret).
- `STRIPE_SECRET_KEY` revocata su Stripe Dashboard → tutte le operazioni Stripe si fermano (contenimento).
- `DASH_SESSION_SECRET` ruotato → cookie dashboard `dcc-dash` invalidati.
- Verificare sempre: log, storage, webhook, integrazioni dopo la revoca.

## 5. Checklist pre-go-live
- [ ] Nessun segreto reale in git (storia inclusa) e in bundle client.
- [ ] `PAYLOAD_SECRET` non usato come credenziale API.
- [ ] Secret per ambiente (no test key in prod).
- [ ] Secret scanning attivo in CI.
- [ ] Procedura di rotazione documentata e testata.
- [ ] Accessi minimi verificati (DB, blob, azioni CI).
