# Rischi Residui — Dark Card Collection

Stato: **bozza iniziale (Fase A)** — aggiornare a ogni modifica/verifica. Documenta rischi residui, limiti, assunzioni e test ancora necessari. Il sistema NON è "100% sicuro".

---

## 1. Rischi residui attuali

| ID | Rischio residuo | Severità | Note / mitigazione parziale |
|---|---|---|---|
| RR-01 | Manipolazione prezzo/quantità al checkout | ~~Critico~~ **MITIGATO** | 2026-08-07: prezzo risolto dal DB (`storePrice`), solo `id`+`quantity` dal client. Test rimanente: T-01. |
| RR-02 | BOLA/IDOR su `/api/stripe/order` | ~~Critico~~ **MITIGATO** | 2026-08-07: verifica sessione Stripe server-side; 404 se non valida/non pagata. Test rimanente: T-02. |
| RR-03 | CVE note in dipendenze (next/sharp/fast-uri) | ~~Alto~~ **MITIGATO** | 2026-08-07: next 16.3.0, payload 3.87.1, sharp 0.35.3 + overrides. Audit: **0 high** (18 moderate, 4 low senza fix: dompurify/monaco, undici, esbuild). Test: T-26. |
| RR-04 | Password statica condivisa + riuso `PAYLOAD_SECRET` | ~~Alto~~ **ELIMINATO** | 2026-08-09: rimosso il flusso legacy (admin prodotti, cron, import Sheets). Il management prodotti passa alle Server Actions dashboard (OAuth). Nessun bearer statico rimasto. |
| RR-05 | Sessione dashboard non revocabile + SQL runner ad alto privilegio | **Alto** | Ancora attivo (REQ-05, non approvato). |
| RR-06 | Overselling e ordini non idempotenti | ~~Alto~~ **MITIGATO** | 2026-08-07: UNIQUE su `stripeSessionId`, webhook idempotente, validazioni currency/status/amount, stock decrementato. **Residuo**: decremento read-modify-write non atomico tra sessioni concorrenti sullo stesso prodotto (rischio minimo, shop single-tenant). Test rimanente: T-27. |
| RR-03b | Vuln moderate/low transitive senza fix | **Moderato** | `dompurify` via `@payloadcms/ui>monaco-editor` (no fix disponibile), `undici` via `payload`/`@vercel/blob`, `esbuild` (dev tooling via drizzle-kit). Monitorare gli advisory; il CI esegue `pnpm audit --prod` a ogni push. |
| RR-07 | Nessun rate limiting | **Alto** | Espone a brute force/abuso/DoS (REQ-07). |
| RR-08 | CSP con `'unsafe-inline'/'unsafe-eval'` | **Medio** | Attenua la protezione anti-XSS (REQ-08). |
| RR-09 | HSTS non configurato | **Medio** | Downgrade/SSL strip residuale (REQ-08). |
| RR-10 | proxy-image: redirect-following, nessun limite dimensione, CORS `*` | **Medio** | SSRF-lite + DoS memoria (REQ-09). |
| RR-13 | Errori che espongono dettagli interni | **Medio** | `String(error)` su endpoint Stripe/dashboard (REQ-11). |
| RR-14 | Nessun audit logging / monitoring / alerting | **Medio** | Rilevamento incidenti limitato (REQ-12). |
| RR-15 | Access control Payload non esplicito (default) | **Medio** | Da testare e rendere deny-by-default esplicito (REQ-13). |
| RR-16 | MFA assente per admin | **Medio** | ATO più probabile (REQ-14). |
| RR-17 | Backup/restore non verificati | **Medio** | Da configurare e testare (REQ-15). |
| RR-18 | First-register/register Payload potenzialmente esposto | **Medio** | Da disabilitare e testare (REQ-13/T-22). |
| RR-19 | Controlli CI limitati (no SAST/DAST/secret scan) | **Medio** | Errori di sicurezza arrivano in prod (REQ-03). |
| RR-21 | Runner SQL può leggere `users` (hash) e funzioni con side-effect | **Basso** | Post REQ-05: restringere ulteriormente. |
| RR-22 | Nessuna branch protection verificata su GitHub | **Basso** | Da configurare. |

## 2. Assunzioni non verificate
- Il provider PostgreSQL (non identificato dal repo) ha: rete privata, TLS, backup cifrati automatici, restore testato, ruoli senza superuser per l'applicazione.
- Stripe webhook è configurato su HTTPS con evento `checkout.session.completed`.
- Il bundle client di produzione non contiene `sk_` e non espone source map.
- Gli header di sicurezza reali in produzione includono HSTS (oggi assenti).
- Le GitHub Actions usate sono quelle ufficiali e non modificate.

## 3. Test ancora necessari (sintesi)
Vedi [`test-plan.md`](./test-plan.md): T-01..T-36. In particolare da eseguire subito (staging):
- T-01, T-02 (manipolazione prezzo, BOLA)
- T-26 (`pnpm audit` / osv)
- T-14 (header, HSTS)
- T-21/T-22 (access control Payload, register/first-register)
- T-25 (restore backup)

## 4. Decisioni di rischio accettato (da validare con l'owner)
- [ ] Accettare temporaneamente RR-03 in attesa dell'upgrade? (sconsigliato: CVE High note)
- [ ] Accettare l'esposizione della publishable key (standard Stripe).
- [ ] Definire RTO/RPO per il DB e accettare il rischio backup.

## 5. Conclusione
Stato al 2026-08-09: mitigati RR-01, RR-02, RR-03 (dipendenze), RR-06; eliminato RR-04 (flusso legacy rimosso). Restano attivi RR-05 (High), RR-07..RR-22 (Medio/Basso). Il progetto **non è pronto al go-live tecnico** finché RR-05 e RR-07 non sono mitigati, e gli altri rischi Alto/Medio documentati e accettati esplicitamente. Nessuna dichiarazione di sicurezza assoluta è possibile.
