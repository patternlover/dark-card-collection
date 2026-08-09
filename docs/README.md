# Documentazione — Dark Card Collection

Tutta la documentazione del progetto è organizzata in questa cartella per argomento.

## Struttura

| Cartella | Contenuto |
|----------|-----------|
| [`project/`](./project/) | Overview, setup, changelog, architettura |
| [`database/`](./database/) | Schema DB e flussi dati |
| [`tracking/`](./tracking/) | GTM dataLayer e tracciamento GA4 |
| [`seo/`](./seo/) | Piano SEO e audit tecnico |
| [`design/`](./design/) | Specifiche design |
| [`security/`](./security/) | Sicurezza: threat model, requisiti, test, incident response |
| [`prompts/`](./prompts/) | Prompt AI riutilizzabili (security plan, content evaluator, design) |

## Indice per file

### Project
- [`project/overview.md`](./project/overview.md) — Architettura, stack, schema, decisioni, flussi
- [`project/setup.md`](./project/setup.md) — Installazione e configurazione iniziale
- [`project/changelog.md`](./project/changelog.md) — Storico modifiche per sessione

### Database
- [`database/schema-and-flows.md`](./database/schema-and-flows.md) — Schema completo Payload/PostgreSQL e flussi (acquisto, import, prezzi, dashboard)

### Tracking
- [`tracking/gtm-datalayer.md`](./tracking/gtm-datalayer.md) — Eventi GA4 e configurazione GTM

### SEO
- [`seo/plan.md`](./seo/plan.md) — Piano operativo SEO + GEO + AI Overviews
- [`seo/audit.md`](./seo/audit.md) — Audit tecnico (score, fix, checklist)

### Design
- [`design/filter-layout.md`](./design/filter-layout.md) — Specifica layout filtri desktop/mobile

### Security
- [`security/`](./security/) — Vedi [indice dedicato](./security/README.md)

### Prompts AI
- [`prompts/design-prompt.md`](./prompts/design-prompt.md) — Prompt di progettazione UX/UI
- [`prompts/security-plan.md`](./prompts/security-plan.md) — Prompt per analisi di sicurezza
- [`prompts/commodity-content-evaluator.md`](./prompts/commodity-content-evaluator.md) — Prompt per valutazione contenuti

## Convenzioni di nomenclatura

- **kebab-case** per tutti i file (`schema-and-flows.md`, non `Schema_and_Flows.md`)
- **Nomi descrittivi** senza prefissi ridondanti (`guide.md` in `security/`, non `SECURITY_GUIDE.md`)
- **Cartelle per argomento** — ogni dominio ha la sua sottocartella
- **File `README.md`** come indice per ogni cartella principale
