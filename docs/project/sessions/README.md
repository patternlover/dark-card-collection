# Sessioni OpenCode — Dark Card Collection

Storico per sessione di lavoro. Ogni sessione ha un file dedicato in questa cartella con due sezioni:

- **Plan** (pianificazione, scritta PRIMA di iniziare): obiettivo, ambito, file coinvolti, verifica prevista.
- **Changelog** (scritto a fine sessione): cosa è stato fatto realmente, decisioni, comandi di verifica, note per le prossime sessioni.

## Convenzioni

- Nome file: `YYYY-MM-DD-titolo-breve.md`. Una sessione = un file.
- La **prima** cosa di ogni sessione: creare (o aggiornare) il file plan. L'**ultima**: compilare la sezione changelog.
- Aggiornare anche `docs/project/changelog.md` con un riepilogo della sessione.
- Includere sempre i numeri di commit e i comandi di verifica eseguiti (`pnpm lint`, `pnpm test`, `pnpm build`, deploy Vercel).
- Le decisioni architetturali vanno anche riflesse in `docs/project/overview.md` quando cambiano il sistema.

## Indice

- [2026-08-10 — Performance + sicurezza dashboard](2026-08-10-dashboard-perf-sec.md)
