# Sessione 2026-08-13 — Dashboard più larga (niente scroll orizzontale)

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo**: allargare il contenuto della dashboard perché le tabelle (es. Listino 8 colonne) stiano senza slider orizzontale.

**Fix (1 riga)**: `src/components/dashboard/DashboardShell.tsx:145` → `<main className="mx-auto max-w-[1440px] ...">` (prima `max-w-6xl` = 1152px). Vale per tutte le pagine dashboard; `overflow-x-auto` della tabella resta come fallback su schermi piccoli.

**Verifica prevista**: lint · test · build · E2E bundle prod (Listino) · commit su main → push → CI → deploy live.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
- `DashboardShell` main: `max-w-6xl` → `max-w-[1440px]` (larghezza contenuto dashboard da 1152 → 1440px dopo la sidebar). Le tabelle a 8 colonne del Listino ora stanno senza scroll orizzontale sui desktop tipici.

### Verifica
`pnpm lint` ✓ · `pnpm test` 75/75 ✓ · `next build` ✓ · E2E bundle prod: Listino+Magazzino **15/15** ✓ (una prima run ha mostrato la flakiness nota del cold-start del server di test; re-run verde).
Nota: main include ora il merge di `feat/dashboard-modals-redesign` (4104366) fatto dall'utente.