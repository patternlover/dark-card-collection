# Incident Response — Dark Card Collection

Stato: **bozza iniziale (Fase A)**.
Runbook tecnico per il team. Ogni runbook segue: rilevazione → contenimento → revoca credenziali → rotazione secret → isolamento servizi → conservazione evidenze → verifica integrità → ripristino → monitoraggio successivo → post-mortem tecnico.

Regole: non cancellare evidenze, non distruggere log, coordinarsi con il proprietario prima di azioni disruptive in produzione.

---

## 0. Playbook generico

### Rilevazione
- Fonti: Vercel (logs, cron, build), Stripe Dashboard, provider DB, GTM/analytics, alert (una volta implementati, REQ-12).

### Contenimento iniziale (1° ora)
1. Confermare l'incidente e assegnare un incident commander.
2. Documentare timeline ed evidenze (screenshot, log, payload).
3. Valutare se fermare operazioni (es. disattivare webhook, ruotare secret, sospendere checkout).

### Evidenze
- Salvare: log Vercel (request id, timestamp), webhook events (Stripe → event.id), snapshot DB (pg_dump) se consentito, immagine dello stato del codice (git rev).
- Non sovrascrivere/non cancellare.

### Post-incidente
- Monitoraggio esteso (24-72h), post-mortem tecnico, aggiornamento [`threat-model.md`](./threat-model.md)/[`residual-risks.md`](./residual-risks.md).

---

## 1. Compromissione account admin (dashboard/CMS)

- **Rilevazione**: login anomali, sessioni multiple, modifiche sospette (prezzi, stati ordine), alert rate limit.
- **Contenimento**: revoca immediata — ruotare `PAYLOAD_SECRET` (invalida sessioni CMS e cookie `dcc-dash` firmati), bloccare l'utente Payload, rimuovere l'email dall'allowlist `DASHBOARD_GOOGLE_EMAILS`.
- **Rotazione secret**: v. [`secrets-management.md`](./secrets-management.md) §3.1/3.4.
- **Isolamento**: sospendere gli endpoint admin (dietro flag/firewall) se necessario.
- **Evidenze**: log accessi, modifiche audit (post REQ-12).
- **Verifica integrità**: controllare Products/Orders/Users per modifiche non autorizzate (importi, stati, email).
- **Ripristino**: ripristinare i valori da backup se alterati (ordini/stock).
- **Monitoraggio**: 72h su nuovi login e modifiche.
- **Post-mortem**: analizzare vettore (password debole? brute force? phishing?).

## 2. Compromissione API key / token (Stripe, cron, admin)

- **Rilevazione**: uso anomalo (errori 401, picchi chiamate), key esposta in repo/bundle/log.
- **Contenimento**: revocare subito la key dal provider.
- **Rotazione**: v. [`secrets-management.md`](./secrets-management.md) §3.2/3.4.
- **Isolamento**: se la key dà accesso a dati, limitare l'account/scope.
- **Evidenze**: log del provider (Vercel, Stripe, Google).
- **Verifica integrità**: dati toccati (blob, sheet, sessioni Stripe).
- **Ripristino/monitoraggio/post-mortem**: come playbook generico.

## 3. Compromissione secret key Stripe (pagamenti)

- **Rilevazione**: transazioni anomale, chiamate API Stripe non attese, key nei log.
- **Contenimento**: revocare `STRIPE_SECRET_KEY` su Dashboard Stripe (stop operazioni); verificare nessun `sk_` in bundle/fe.
- **Rotazione**: §3.2.
- **Evidenze**: Stripe Dashboard (payments, refunds, logs API), webhook.
- **Verifica integrità**: ordini/refund non autorizzati, dati carta (mai salvati ✓).
- **Ripristino**: refund di transazioni fraudolente con verifica.
- **Monitoraggio**: 72h su pagamenti/refund.

## 4. SQL injection

- **Rilevazione**: query anomale nei log DB, errori 500, alert.
- **Contenimento**: sospendere l'endpoint vulnerabile; bloccare l'IP sorgente.
- **Evidenze**: query loggate, payload ricevuti.
- **Verifica integrità**: estrazione dati (users/orders)? → valutare notifica proprietario; ruotare password utenti se hash esposti.
- **Correzione**: query parametrizzate (verificare che non ce ne siano di concatenate).
- **Monitoraggio**: 72h su errori DB e pattern.

## 5. Data leakage (ordini/PII via BOLA, export non autorizzato)

- **Rilevazione**: scraping, accessi anomali a `/api/stripe/order`, dump/export non autorizzati.
- **Contenimento**: disattivare l'endpoint/esporre meno dati (REQ-02), revocare token/sessioni coinvolti.
- **Evidenze**: log accessi.
- **Verifica**: quali record sono stati letti; se PII esposta → gestire secondo procedure (il piano esclude l'aspetto normativo).
- **Ripristino**: ripristinare la superficie minima; rotazione sessioni coinvolte.
- **Monitoraggio**: alert su accessi anomali.

## 6. Malware / compromissione runtime

- **Rilevazione**: build anomale, dipendenze sospette, comportamenti inattesi.
- **Contenimento**: sospendere il deploy, isolare gli ambienti.
- **Evidenze**: artifact build, lockfile, log.
- **Verifica integrità**: confronto dipendenze con lockfile/pinning; scan immagini.
- **Ripristino**: rebuild pulito (container/redeploy) da codice verificato.
- **Monitoraggio**: 72h.

## 7. Dipendenza compromessa (supply chain)

- **Rilevazione**: advisory pubblica, scan CI (REQ-03), anomalie.
- **Contenimento**: identificare usi del pacchetto; pin/rollback a versione sicura.
- **Evidenze**: versioni installate, lockfile.
- **Ripristino**: aggiornare/patchare, rebuild, redeploy.
- **Monitoraggio**: audit in CI continuo.

## 8. Database compromesso / accesso non autorizzato

- **Rilevazione**: connessioni da IP non attesi, query anomale, permessi modificati.
- **Contenimento**: revoca accessi, limitazione rete DB (allowlist), rotazione `DATABASE_URI`.
- **Evidenze**: log provider DB, snapshot.
- **Verifica integrità**: modifiche non autorizzate a prodotti/ordini/utenti.
- **Ripristino**: restore da backup verificato (ultimo buono), replay log se disponibile.
- **Monitoraggio**: 72h+.

## 9. Webhook manipolati / ordini alterati

- **Rilevazione**: ordini anomali, webhook falliti, duplicati, importi non coerenti.
- **Contenimento**: verificare firme (già implementato); se sospetto, sospendere l'elaborazione webhook.
- **Evidenze**: eventi Stripe, log.
- **Verifica integrità**: ordini creati senza pagamento → cancellare/rifondare.
- **Correzione**: idempotenza + check valuta/importo/status (REQ-06).
- **Monitoraggio**: alert webhook.

## 10. Ransomware / perdita backup

- **Rilevazione**: crittografia inattesa dei dati, backup inaccessibili.
- **Contenimento**: isolare rete/storage, disconnettere backup.
- **Evidenze**: log, manifest.
- **Verifica integrità**: backup immutabili (immutability del provider).
- **Ripristino**: da backup immutabile, testato (REQ-15).
- **Monitoraggio/post-mortem**: valutare cause (accessi, phishing).

## 11. Compromissione pipeline CI/CD

- **Rilevazione**: job anomali, secret esposti, modifiche a workflow non approvate.
- **Contenimento**: bloccare i run, ruotare tutti i secret usati in CI, sospendere deploy automatici.
- **Evidenze**: log runner, secrets history, eventi GitHub.
- **Verifica integrità**: file `.github/workflows/*`, lockfile, codice artefatto.
- **Ripristino**: ripristinare workflow da git verificato; branch protection; approval.
- **Monitoraggio**: audit GitHub.

---

## 12. Matrice contatti e priorità
- Incident commander: owner tecnico.
- Escalation: proprietario azienda (autorizzazioni produzione).
- Prioritizzazione: Critico (pagamenti/PII/DB) → Alto (admin/secret) → Medio.

## 13. Evidenze e retention
- Log Vercel e webhook: conservare ≥ 30 giorni.
- Snapshot DB: per indagine.
- Non includere mai secret nei report; usare riferimenti `[REDACTED]`.
