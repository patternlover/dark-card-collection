# Sessione 2026-08-12 — Listino a gruppi + nomi completi (Magazzino/Listino)

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo**: rendere il Listino una vista a **gruppi per `title`** (varianti), con nomi completi, quantità, contatore venduti, disponibilità In stock/OOS, costo medio (media storica confermata), filtri ridefiniti (Stato rimosso: è dettaglio per item). Magazzino: nomi completi.

**Conferme utente**:
- Grouping per campo `title` (stesso titolo = gruppo; es. "Collezione Illustrazione Primi Compagni d'Avventura Serie 3/2").
- Lo **stato** è per singola variante: niente stato/venduto sul gruppo → solo contatore sobrio "×N venduti".
- Filtri: Disponibilità (In stock/OOS) · Canale vendita (dropdown dinamico da `orders.sales_channel`) · Visibilità gruppo (Visibili/Nascosti) · Vetrina (In evidenza).
- "Nascondi/Mostra" e "Vetrina" applicati a **tutte** le varianti del gruppo ("o nascondo tutti o nessuno").
- Costo medio: media **storica** ponderata su tutti i lotti (invariata, `cost_of_goods_sold`).

**File coinvolti**:
- `src/components/dashboard/InventorySection.tsx` (truncate → wrap)
- `src/components/dashboard/ListingsSection.tsx` (riscrittura vista a gruppi)
- `src/app/dashboard/actions.ts` (nuove `searchListings`, `updateGroup`)
- `src/lib/listings.ts` (nuovo modulo puro: grouping + summary vendite)
- `tests/listings.test.ts` (nuovo unit test)
- `tests-e2e/products.spec.ts` (hide ora per gruppo) + nuovo E2E listino

**Verifica prevista**: `pnpm lint` · `pnpm test` · `next build` · E2E su bundle prod · commit → push → CI → deploy live → docs.

---

## Changelog (compilato a fine sessione)

### Implementato
- **Magazzino** (`InventorySection.tsx`): nomi completi (via `max-w-[260px] truncate`, ora `break-words`).
- **Listino** (`ListingsSection.tsx` riscritto) — vista a **gruppi per `title`**:
  - Riga gruppo: nome completo + badge "n varianti" · Qty disponibile · contatore sobrio **×N venduti** · badge Disponibilità (In stock / Esaurito-OOS, da qty) · Prezzo (minimo) · **Costo medio** (media storica ponderata su tutti i lotti, da `cost_of_goods_sold`).
  - Espansione: righe **variante** con stato (Disponibile/In Attesa/Venduto), disponibilità, prezzo, costo, riepilogo **venduto per item** (canale + importo) e modifica.
  - "Nascondi/Mostra" e "Vetrina" applicati a **tutte** le varianti del gruppo ("o nascondo tutti o nessuno") via nuova action `updateGroup`.
  - **Filtri** (Stato rimosso: dettaglio per item): Disponibilità · Canale vendita (dropdown **dinamico** dai valori `sales_channel` in DB, "allineato") · Visibilità gruppo · Vetrina.
- **Data layer**: nuove server action `searchListings` (fetch prodotti+ordini, grouping per title, summary vendite per canale solo da ordini pagati `paid/shipped/delivered`, paginazione su gruppi, risultato con `error` invece di throw → niente #441) e `getProductById` (per il modale modifica). Logica pura testata in `src/lib/listings.ts` (`buildListingGroups`, `filterListingGroups`, `deriveAvailability`).

### Modello dati confermato
- Products = una riga per prodotto/variante visibile; costo d'acquisto e luogo nei Lotti (`purchases_lines`); vendite/piattaforma in `orders`/`orders_items` con `sales_channel`. Nessuna migration (nessuna modifica schema).

### Test
- Unit `tests/listings.test.ts` (16 nuovi): grouping, qty/disponibilità, costo medio (media storica + fallback), venduti per canale, visibilità/hidden/featured, filtri.
- E2E `tests-e2e/listings-groups.spec.ts` (4 nuovi): nomi completi, qty+badge disponibilità+hide gruppo, varianti raggruppate/espandibili, contatore venduti + filtro canale.
- Aggiornato `tests-e2e/products.spec.ts` (titoli bottoni hide/show → "…(tutte le varianti)").

### Verifica
`pnpm lint` ✓ · `pnpm test` 60/60 ✓ · `next build` ✓ · **Playwright su bundle prod 35/35** ✓ (28 preesistenti + 4 nuovi + console-clean senza errori hydration).

### Note
- Featured resta a livello gruppo (toggle applica a tutte le varianti); il filtro vetrina matcha gruppi con varianti in vetrina.
- Lo stato (Disponibile/In Attesa/Venduto) vive SOLO nelle righe variante (dettaglio per item), non sul gruppo — come richiesto.
