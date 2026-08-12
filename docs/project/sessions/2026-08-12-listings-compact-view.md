# Sessione 2026-08-12 — Listino: vista iniziale compatta + layout filtri (su main)

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo**: modifiche a `/dashboard/listings`, **tutto su main** (niente branch feature).

1. **Vista iniziale compatta**: varianti nascoste di default.
   - Gruppo con **1 variante** → riga gruppo + riga variante sempre visibili.
   - Gruppo con **>1 variante** → di default solo la riga gruppo compatta (nome, qty, ×venduti, disponibilità, prezzo, costo medio, azioni); chevron per espandere/collassare le righe variante nella stessa tabella (stessi header, niente sotto-tabella).
   - **Toggle nascondi rapido per singola variante** nel dettaglio espanso: nuova action strutturata `toggleVariantVisibility` (`{ok, message}`, niente throw → niente #441).
   - Stato resta solo sulle righe variante.
2. **Layout filtri a 2 righe**: riga 1 = i due Select (Disponibilità, Visibilità) affiancati; riga 2 = barra ricerca (flex-1) + tasto Cerca a destra.

**File coinvolti**:
- `src/app/dashboard/actions.ts` (nuova `toggleVariantVisibility`)
- `src/components/dashboard/ListingsSection.tsx` (chevron/espansione, toggle variante, toolbar 2 righe)
- `tests-e2e/listings-groups.spec.ts` (regola collasso + toggle nascondi variante)

**Verifica prevista**: `pnpm lint` · `pnpm test` · `next build` · E2E su bundle prod (localhost:3000) · commit su main → push → CI → deploy live → docs.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
- **Vista iniziale compatta** (`ListingsSection.tsx`):
  - Gruppo con **1 variante** → riga gruppo + riga variante sempre visibili (Stato, grade·lingua, azioni).
  - Gruppo con **>1 variante** → di default solo la **riga gruppo compatta**; chevron "Mostra/Comprimi varianti" per espandere/collassare le righe variante nella stessa tabella (stessi header, niente sotto-tabella).
  - **Toggle nascondi rapido per singola variante** nel dettaglio espanso (occhio) → nuova action strutturata `toggleVariantVisibility(id, isVisible)` (`{ok, message}`, niente throw → niente #441); visibilità del gruppo ricalcolata.
- **Layout filtri a 2 righe**: riga 1 = Select Disponibilità + Visibilità affiancati; riga 2 = barra di ricerca (flex-1) + tasto Cerca a destra.
- Stato resta SOLO sulle righe variante.

### Test
- Unit: 60/60 (invariati, la lib non cambia).
- E2E `listings-groups.spec.ts`: aggiornato "multi-variant collapsed/expandable", nuovo "single-variant shows row without expanding", nuovo "hides a single variant"; totale E2E 37.

### Verifica
`pnpm lint` ✓ · `pnpm test` 60/60 ✓ · `next build` ✓ · **Playwright su bundle prod 37/37** ✓ (console-clean senza errori hydration).

### Note
- Commit su `main` (branch feature non toccato).
