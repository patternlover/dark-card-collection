# Sessioni OpenCode — Dark Card Collection

Storico per sessione di lavoro. Ogni sessione ha un file dedicato in questa cartella con due sezioni:

- **Plan** (pianificazione, scritta PRIMA di iniziare): obiettivo, ambito, file coinvolti, verifica prevista.
- **Changelog** (scritto a fine sessione): cosa è stato fatto realmente, decisioni, comandi di verifica, note per le prossime sessioni.

## Convenzioni

- Nome file: `YYYY-MM-DD-titolo-breve.md`. Una sessione = un file.
- La **prima** cosa di ogni sessione: creare (o aggiornare) il file plan. L'**ultima**: compilare la sezione changelog.
- **All'inizio di ogni sessione** leggere **[`PENDING.md`](../PENDING.md)** (task in sospeso a vita lunga) e verificare se ci sono task `open`/`blocked` che impattano l'ambito di lavoro; gestirli o dichiararli esplicitamente prima di buildare. Alla fine di ogni fase/sessione aggiornare il tracker (mai lasciare task `done` senza verifica).
- Aggiornare anche `docs/project/changelog.md` con un riepilogo della sessione.
- Includere sempre i numeri di commit e i comandi di verifica eseguiti (`pnpm lint`, `pnpm test`, `pnpm build`, deploy Vercel).
- Le decisioni architetturali vanno anche riflesse in `docs/project/overview.md` quando cambiano il sistema.

## Indice

- [Task in sospeso (tracker a vita lunga)](PENDING.md)
- [2026-08-10 — Performance + sicurezza dashboard](2026-08-10-dashboard-perf-sec.md)
- [2026-08-10 — Modulo Acquisti e Vendite Esterne](2026-08-10-purchases-and-external-sales.md)
- [2026-08-12 — Allineamento progetto a AGENTS.md / overview.md](2026-08-12-align-model.md)
- [2026-08-12 — Fix delete prodotto live (#441)](2026-08-12-fix-delete-product-live.md)
- [2026-08-12 — Listino a gruppi per nome + nomi completi](2026-08-12-listings-groups-full-names.md)
- [2026-08-12 — Listino: filtri ridotti + tabella piatta](2026-08-12-listings-simplify.md)
- [2026-08-12 — Listino: vista iniziale compatta + layout filtri](2026-08-12-listings-compact-view.md)
- [2026-08-12 — Listino a 2 viste: Gruppi / Prodotti + vendita manuale](2026-08-12-listings-two-views.md)
- [2026-08-12 — Fix Mostra + homepage In evidenza (featured 4 slot)](2026-08-12-listings-fix-show-featured.md)
- [2026-08-13 — Listino: tabella /inventory + sorting per header + email cliente](2026-08-13-listings-sortable-clean.md)
- [2026-08-13 — Listino: nome su una riga + stella in fondo riga + header uniforme](2026-08-13-listings-row-height.md)
- [2026-08-13 — Dashboard più larga (niente scroll orizzontale)](2026-08-13-dashboard-wider.md)
- [2026-08-13 — item_category + rename Collezioni→Espansioni](2026-08-13-item-category-espansioni.md)
