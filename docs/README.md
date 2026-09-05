# Documentazione — Dark Card Collection

> **Stato architettura**: storefront Next.js (root) + **backend Medusa v2** (`apps/backend/`). Payload è stato rimosso (2026-09-05). L'ops vive in Medusa Admin.
> ⚠️ Checkout Stripe **pausato** — vedi `project/PENDING.md` (R3).

## Documenti principali (attuali)

| Documento | Contenuto |
|-----------|-----------|
| [`project/overview.md`](./project/overview.md) | Architettura, dominio, decisioni, stack |
| [`project/PENDING.md`](./project/PENDING.md) | **Tracker unico** delle task in sospeso (leggere a inizio sessione) |
| [`project/changelog.md`](./project/changelog.md) | Storico modifiche per sessione |
| [`project/setup.md`](./project/setup.md) | Setup storefront + backend Medusa |
| [`project/sessions/README.md`](./project/sessions/README.md) | Indice sessioni (plan + changelog) |
| [`database/schema-and-flows.md`](./database/schema-and-flows.md) | Schema DB Medusa + flussi |
| [`medusa/REPLATFORMING.md`](./medusa/REPLATFORMING.md) | Piano di migrazione (completato) |
| [`medusa/DEPLOYMENT.md`](./medusa/DEPLOYMENT.md) | Deploy backend su Oracle Cloud (Docker) |

## Documenti legacy (era Payload — storici)

Le cartelle `security/`, `tracking/`, `seo/`, `design/`, `prompts/` documentano l'era **Payload/dashboard** (rimossa):
sono utili come storia delle decisioni, ma **non riflettono l'architettura attuale**. Verificare prima di basarci:
- [`security/README.md`](./security/README.md) — threat model e requisiti (era Payload; riallineare a Medusa quando serve)
- [`tracking/gtm-datalayer.md`](./tracking/gtm-datalayer.md) — eventi GA4 (schema sostanzialmente invariato; fonte: `src/lib/analytics.ts`)
- [`seo/plan.md`](./seo/plan.md), [`seo/audit.md`](./seo/audit.md) — piano e audit SEO (storefront invariato)
- [`design/filter-layout.md`](./design/filter-layout.md) — specifica layout filtri
- [`prompts/`](./prompts/) — prompt AI riutilizzabili

## Convenzioni di nomenclatura

- **kebab-case** per i file · cartelle per argomento · `README.md` come indice di ogni cartella.