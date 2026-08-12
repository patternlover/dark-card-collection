# Sessione 2026-08-12 — Listino: semplificazione filtri + tabella piatta (no sotto-tabella)

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo**: modifiche a `/dashboard/listings`:
1. Rimuovere i filtri **Canale di vendita** e **In evidenza** (restano: ricerca, Disponibilità, Visibilità gruppo, Cerca).
2. Rimuovere il badge **"n varianti"** dalle righe gruppo.
3. **Prezzo + Costo medio invariati** (Prezzo = prezzo di vendita uniforme del gruppo; Costo medio = media storica dal DB) — nessuna modifica.
4. Filtri tutti su **una sola riga** (toolbar `flex-nowrap`).
5. **Tabella unica piatta**: riga gruppo (title + aggregati + azioni) seguita dalle righe variante nella stessa tabella con un solo header (Prodotto | Qty | Venduti | Disponibilità | Prezzo | Costo medio | Stato | Azioni). Via espansione/chevron e sotto-tabella annidata. Stato visibile SOLO sulle righe variante.

**File coinvolti**:
- `src/app/dashboard/actions.ts` (rimozione `channels`/filtri `channel`+`featured` da `searchListings`)
- `src/components/dashboard/ListingsSection.tsx` (riscrittura tabella piatta + toolbar)
- `tests-e2e/listings-groups.spec.ts` (aggiornare: niente espansione/badge, test canale → contatore venduti)
- `src/lib/listings.ts` (invariata)

**Verifica prevista**: `pnpm lint` · `pnpm test` · `next build` · E2E su bundle prod · commit → push → CI → deploy live → docs.

---

## Changelog (compilato a fine sessione)

### Implementato
- **Filtri ridotti**: rimossi dal Listino i dropdown "Canale di vendita" e "In evidenza". Restano ricerca, Disponibilità, Visibilità gruppo, Cerca.
- **Backend pulito**: `searchListings` non raccoglie più i canali (`channels` rimosso dal risultato e dal fetch) e `ListingSearchFilters` perde `channel`/`featured` (rimasti solo nella lib `filterListingGroups`, invariata e ancora testata in unit).
- **Badge "n varianti"**: rimosso dalle righe gruppo.
- **Prezzo + Costo medio**: invariati (Prezzo = prezzo di vendita uniforme del gruppo; Costo medio = media storica dal DB).
- **Filtri su una riga**: toolbar `flex-nowrap`.
- **Tabella piatta** (via sotto-tabella annidata ed espansione/chevron): un solo header `Prodotto | Qty | Venduti | Disponibilità | Prezzo | Costo medio | Stato | Azioni`; riga gruppo (nome completo + stella vetrina, qty totale, ×venduti, disponibilità gruppo, prezzo, costo, azioni gruppo) seguita dalle righe variante (title + grade·cond·lingua, qty, venduto per item con canale+importo, disponibilità, prezzo, costo, **stato per item**, modifica variante). Le righe del gruppo sono raggruppate con `Fragment key` (niente warning React sulle key).

### Test
- E2E `listings-groups.spec.ts` aggiornato: varianti come righe piatte (2 "Modifica variante" nel gruppo, niente chevron/badge), contatore ×venduti; `.first()` sui locator riga (group row + varianti condividono il titolo). `products.spec.ts`: `.first()` sui locator del Listino.
- Nota: il repo era avanzato a `b762760` (modal vendita esterna con select raggruppata per titolo); gli E2E usano il pattern di `orders.spec.ts` (`option...first()`).

### Verifica
`pnpm lint` ✓ · `pnpm test` 66/66 ✓ · `next build` ✓ · **Playwright su bundle prod 35/35** ✓ (console-clean senza errori hydration).

### Note
- Lo stato resta SOLO sulle righe variante (dettaglio per item), mai sul gruppo.
- `variantCount` e i filtri `channel`/`featured` restano nella lib `filterListingGroups` (future-proof), non più esposti nel Listino.
