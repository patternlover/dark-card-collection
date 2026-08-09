# Security — Dark Card Collection

Documentazione di sicurezza tecnica: analisi, requisiti, test e operazioni.

## Indice

| File | Contenuto |
|------|-----------|
| [`guide.md`](./guide.md) | Guida tecnica di sicurezza (regole operative per auth, API, DB, Stripe, frontend, segreti) |
| [`architecture.md`](./architecture.md) | Architettura di sicurezza (stack, ambienti, ruoli, flussi dati, header, asset) |
| [`threat-model.md`](./threat-model.md) — | Threat model STRIDE + OWASP (16 minacce, T01–T16) |
| [`attack-surface.md`](./attack-surface.md) | Superficie d'attacco per endpoint |
| [`requirements.md`](./requirements.md) | Requisiti di sicurezza prioritizzati (REQ-01..REQ-15) |
| [`secrets-management.md`](./secrets-management.md) | Gestione segreti: inventario, rotazione, revoca |
| [`incident-response.md`](./incident-response.md) | Runbook tecnico per incidenti |
| [`residual-risks.md`](./residual-risks.md) | Rischi residui e assunzioni non verificate |
| [`test-plan.md`](./test-plan.md) | Piano di test (T-01..T-36) |
| [`changelog.md`](./changelog.md) | Registro attività di sicurezza |

## Stato

Fase A (analisi) completata. Fase B (remediation) parzialmente applicata (REQ-01, REQ-02, REQ-03, REQ-04, REQ-06). Vedi [`changelog.md`](./changelog.md) per il dettaglio.

## Principi guida

- **Deny by default** per ogni accesso
- **Minimo privilegio** per ruoli, DB, token
- **Zero trust**: mai fidarsi del client
- **Defense in depth**: validazione + autorizzazione + rate limit + logging
