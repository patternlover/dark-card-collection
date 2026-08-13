# Sessione 2026-08-13 — Listino: tabella stile /inventory + sorting per header + email cliente (su main)

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo** `/dashboard/listings`:
1. **Tabella Gruppi allineata a /inventory**: righe piatte (via sfondo evidenziato), titolo `font-medium`, stessi colori/tipi cella di Prodotti/inventory. Gruppi = Prodotti a livello di stile.
2. **Email cliente** nella vendita manuale (campo **opzionale** nel modale Vendi) → `recordManualWebsiteSale` la valida e usa `email || 'manual@darkcardcollection.com'`.
3. **Sorting per header (server-side) + via search e filtri** da ENTRAMBE le viste: niente search bar né dropdown (Stato/Disponibilità/Visibilità). Header cliccabili: 1° click asc, 2° desc, freccia sull'attivo. Data layer: `sortBy`/`sortDir` in `searchListings`/`searchListingProducts`; helper puri `sortListingGroups`/`sortListingItems` in `src/lib/listings.ts` (ordinano prima della paginazione).

**File coinvolti**: `src/lib/listings.ts` · `src/app/dashboard/actions.ts` · `src/components/dashboard/ListingsSection.tsx` · `tests/listings.test.ts` · `tests-e2e/listings-groups.spec.ts` · docs.

**Verifica prevista**: lint · test · build · E2E bundle prod · commit su main → push → CI → deploy live → docs.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
- **Tabella Gruppi allineata a /inventory** (`ListingsSection.tsx`): righe gruppo **piatte** (via `bg-[var(--ui-surface-alt)]`), titolo `font-medium`, stessi tipi/colori di cella delle viste Prodotti/inventory.
- **Sorting per header (server-side)**: header cliccabili in entrambe le viste (1° click asc, 2° click desc, freccia sull'attivo; Azioni non ordinabile). Data layer: `sortBy`/`sortDir` in `searchListings`/`searchListingProducts`; helper puri `sortListingGroups`/`sortListingItems` in `src/lib/listings.ts` (null in coda, numerici per qty/prezzi/costi, stringhe per titolo/disponibilità/stato).
- **Rimozione search bar e dropdown** da entrambe le viste (Stato/Disponibilità/Visibilità): tabella pulita, solo TogglePills + paginazione.
- **Email cliente** nella vendita manuale: campo opzionale nel modale Vendi → `recordManualWebsiteSale` la valida e usa `email || 'manual@darkcardcollection.com'`.

### Test
- Unit: 69/69 (+7 sorting: gruppi/items asc-desc, null in coda, immutabilità).
- E2E `listings-groups.spec.ts`: rimosso il test "search live"; nuovo "clicking a column header sorts asc then desc (no search bar)"; flusso Vendi con email cliente. Totale E2E 40.

### Verifica
`pnpm lint` ✓ · `pnpm test` 69/69 ✓ · `next build` ✓ · **Playwright su bundle prod 40/40** ✓ (console-clean senza errori hydration). Un flake transitorio su "products view hide single" in una run della suite completa, non riprodotto (2 run verdi).

### Note
- I filtri (Stato/Disponibilità/Visibilità) restano nelle lib `filterListingGroups`/`filterListingItems` (testate) ma non sono più esposti nell'UI.
- La vendita manuale registra l'email se fornita (ordine richiede sempre un'email → fallback `manual@darkcardcollection.com`).
