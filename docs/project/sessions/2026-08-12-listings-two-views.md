# Sessione 2026-08-12 — Listino a 2 viste: Gruppi prodotto / Prodotti singoli (UX slim)

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo**: `/dashboard/listings` con 2 visualizzazioni sulla stessa pagina, grafica identica a /inventory.

- **TogglePills** "Gruppi prodotto | Prodotti" (default Gruppi).
- **Vista Gruppi**: colonne `Prodotto | Qty | Venduti | Disponibilità | Prezzo (sul sito) | Costo medio | Azioni` — niente colonna Stato, niente chevron/varianti (una riga per gruppo).
- **Vista Prodotti**: `Prodotto (nome + grade·cond·lingua) | Stock | Venduti | Disponibilità | Prezzo | Costo medio | Stato | Azioni` — occhio nascondi/mostra singolo, **Vendi**, Modifica.
- **Vendita manuale**: pulsante "Vendi" per item → modale minimale (qty max stock, prezzo precompilato) → nuova action strutturata `recordManualWebsiteSale` (canale `website`, non Stripe, pipeline `recordSale` → ordine+stock+FIFO).
- **Search bar live sul DB senza pulsante "Cerca"** (debounce ~300ms), in alto a destra della tabella; filtri compatti (select piccole): Gruppi → Disponibilità+Visibilità; Prodotti → Stato+Disponibilità+Visibilità.
- **Data layer**: refactor dataset condiviso (prodotti+ordini→sales) tra `searchListings` e nuova `searchListingProducts` (item piatti via `flattenListingItems` in `src/lib/listings.ts`, paginazione su item).

**File coinvolti**: `src/lib/listings.ts` · `src/app/dashboard/actions.ts` · `src/components/dashboard/ListingsSection.tsx` · `tests/listings.test.ts` (+ mock sale) · `tests-e2e/listings-groups.spec.ts` · docs.

**Verifica prevista**: `pnpm lint` · `pnpm test` · `next build` · E2E su bundle prod · commit su main → push → CI → deploy live → docs.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
- **2 viste sulla stessa pagina** (`/dashboard/listings`) con **TogglePills** "Gruppi prodotto | Prodotti" (default Gruppi).
- **Vista Gruppi**: una riga per gruppo, colonne `Prodotto | Qty | Venduti | Disponibilità | Prezzo (sul sito) | Costo medio | Azioni` — **senza colonna Stato**, senza chevron/varianti. Azioni: vetrina, nascondi/mostra gruppo, modifica.
- **Vista Prodotti** (grafica /inventory): `Prodotto (nome + grade·cond·lingua) | Stock | Venduti (per item) | Disponibilità | Prezzo | Costo medio | Stato | Azioni` — occhio nascondi/mostra singolo, **Vendi**, Modifica.
- **Vendita manuale sul sito** (non Stripe): pulsante "Vendi" per item → modale minimale (qty max stock, prezzo precompilato) → nuova action strutturata `recordManualWebsiteSale` (canale `website`, `transactionId WEB-MANUAL-<ts>`, pipeline `recordSale` → ordine + stock + FIFO + snapshot costo). Niente throw → niente #441.
- **Search live sul DB senza pulsante "Cerca"**: input in alto a destra della tabella, debounce 300ms → `setAppliedQuery` + pagina 1; la ricerca usa `where: { title: { contains } }` su Payload.
- **Filtri compatti** (select piccole): Gruppi → Disponibilità + Visibilità; Prodotti → Stato + Disponibilità + Visibilità.
- **Data layer**: refactor dataset condiviso `fetchListingDataset` (prodotti + ordini → sales) tra `searchListings` e nuova `searchListingProducts` (item piatti via `flattenListingItems` in `src/lib/listings.ts`, paginazione su item).

### Test
- Unit: 62/62 (+2 `flattenListingItems`).
- E2E `listings-groups.spec.ts` riscritto (7 test): vista Gruppi default (nomi completi, qty/badge/hide gruppo, gruppo multi-variante 1 riga, contatore venduti), vista Prodotti (riga per item + hide singolo, **Vendi** con stock scalato), **search live senza pulsante**.

### Verifica
`pnpm lint` ✓ · `pnpm test` 62/62 ✓ · `next build` ✓ · **Playwright su bundle prod 38/38** ✓ (console-clean senza errori hydration).

### Note
- Stato solo nella vista Prodotti (per item); la vista Gruppi non ha colonna Stato.
- `recordExternalSale` in Ordini invariata (canali esterni); `recordManualWebsiteSale` è il flusso "Sito web" manuale.
