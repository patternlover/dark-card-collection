# Sessione 2026-08-13 — item_category (carte/prodotti) + rename completo Collezioni→Espansioni

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo** (su main):
1. **Rename completo** "Collezioni" → "Espansioni": slug Payload `espansioni`, tabella rinominata, campo Products `collection`→`expansion`, route `/dashboard/espansioni` e `/shop/espansioni` (+ redirect), etichette ovunque (dashboard + storefront).
2. **`item_category`** su Products (`card` | `product`, default `product`): modali con selettore "Tipo articolo" e sezioni condizionali — **"Dettagli carta"** (Condizione/Grado MINT-NM, Lingua, Card Number, Rarità) solo per carte, **"Dettagli prodotto"** (Product Type, Google Product Category, Pre-Ordine) solo per prodotti. Il grade non compare sui prodotti; i campi carta restano NULL sui prodotti.
3. `item_group_id` disponibile per entrambi.
4. **Badge "Carta"/"Prodotto"** sulle card dello shop.

**Fasi**: 1) Payload+DB (config, generate:types, migration rename manuale, drift-check) · 2) Dashboard (actions, nav, EspansionsSection, modali, lotti) · 3) Storefront (route+redirect, etichette, badge) · 4) Test E2E (route aggiornate + nuovi casi) · 5) Verifica completa + docs + commit → push → CI → deploy live.

**Rischi**: migration rename tabella+FK+tabelle di sistema Payload (payload_locked_documents_rels / payload_preferences_rels) — gestita manualmente, verificata con `check-schema-drift`.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
**Rename completo "Collezioni" → "Espansioni"**:
- Payload: collection `Collections` → **`Espansioni`** (slug `espansioni`, dir/file rinominati); `Products.expansion` (ex `collection`, relationTo 'espansioni').
- **Migration `20260813_espansioni_item_category.ts`** (idempotente, up/down): rename tabella `collections`→`espansioni` (+sequence), `products.collection_id`→`expansion_id` (+FK `products_expansion_id_espansioni_id_fk`, indice), `payload_locked_documents_rels.collections_id`→`espansioni_id` (+FK/indice, tabella di sistema Payload), drop legacy vuota in caso di push fresh; aggiunto `item_category` (enum `product|card`, default `product`).
- Route: `/dashboard/espansioni` (ex `/dashboard/collezioni`), `/shop/espansioni/*` (ex `/shop/collections/*`) **con redirect** dalla vecchia; sitemap, breadcrumb, titoli, filtri, footer, guide, llms aggiornati; `CollectionsShowcase` → `EspansionsShowcase`.
- Dashboard: `EspansionsSection` (ex CollectionsSection), nav "Espansioni", azioni/etichette (`getEspansioni`, `createEspansione`, …), modali e Lotti ("— Espansione —").
- Codice: `ProductDTO.collection` → `expansion`, `UpdateProductPatch.collection` → `expansion`, `CreatePurchaseLineInput.newProductCollection` → `newProductExpansion`; `ClientListing` filtro "Espansione"; PDP "Espansione: …".

**`item_category` (carte vs prodotti)**:
- Products: nuovo campo `item_category` (`product` | `card`, default `product`; sui prodotti i campi carta restano NULL e il grade non compare mai).
- **Modali Create/Edit Prodotto** (Listino/Magazzino-duplica): selettore **"Tipo articolo"** → sezione **"Dettagli carta"** (Condizione/Grado MINT-NM, Condizione Google, Lingua, Card Number, Rarità) solo per carte e sezione **"Dettagli prodotto"** (Product Type, Google Product Category, Pre-Ordine) solo per prodotti; cambio tipo → campi dell'altra categoria azzerati/NULL; `item_group_id` disponibile per entrambi.
- **Badge "Carta"/"Prodotto"** sulle card dello shop (`ProductGroup.itemCategory` + `Badge` variant `card`).

### Test
- Unit: 75/75 (invariati, +rename `expansion` nei fixture).
- E2E: route aggiornate in `catalog.spec.ts`/`modals-flows.spec.ts` (`/dashboard/espansioni`, etichette); **nuovo `item-category.spec.ts`** (4 casi: modale prodotto senza Dettagli carta, switch a Carta con persistenza, badge sul shop, redirect `/shop/collections`→`/shop/espansioni`). **Suite completa 51/51** su bundle prod.
- Migration validata su DB legacy (up idempotente + down) e **drift-check: NESSUNO**.
- Nota: la creazione prodotti ora avviene SOLO via Lotti (pulsante Magazzino rimosso dal redesign delle modali, già mergiato); il tipo articolo si imposta/aggiorna nel modale del Listino.

### Verifica
`pnpm lint` ✓ · `pnpm test` 75/75 ✓ · `next build` ✓ · **Playwright bundle prod 51/51** ✓ · drift schema ✓.
