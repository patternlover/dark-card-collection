# Sessione 2026-08-14 — item_category_2 colonna, Categorie dinamiche (micro), semplificazione stato, slug inglesi, tabelle uniformi

## Plan (scritto prima di implementare — confermato in chat)

1. **DB**: colonna relationship `item_category_2_id` → `item_category_2` (`dbName` sul campo, relationship a espansioni invariata) + migration rename FK/indice.
2. **Categorie dinamiche**: collection `categories` (CRUD `/dashboard/categories`) = valori di `item_category_3`, che da enum diventa **relationship → categories**; migration (create tabella, seed Spc/Box/Bundle/Etb/Tin/Singola/Slab/Altro, migra prodotti, drop enum, rels Payload); storefront filtro "Micro prodotto" dinamico.
3. **Semplificazione stato**: via `status` e `is_preorder` (migration drop + hook solo availability da quantity); via `/shop/preorders`; storefront senza filtro status (solo is_visible + availability per "Esaurito").
4. **Modale minimale**: via slug, disponibilità (auto), pre-ordine, stato. "Esaurito" senza "(OOS)" ovunque. /listati: Prezzo e Costo medio invertiti, via colonna Stato.
5. **Slug dashboard inglesi** (settings, expansions, listings, categories) + redirect 308; etichette italiane invariate.
6. **Tabelle uniformi stile /listati**: `SortableTh` in `ui/` ovunque; niente dropdown; ordinamento server-side (Magazzino/Lotti) e client-side (Ordini/Messaggi/Espansioni/Categorie); search dove serve.
7. Test (unit+E2E) · docs · commit → push → CI → deploy live.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
**DB**:
- `item_category_2` resta relationship → `espansioni` (confermato). Nota: Payload 3 **non supporta `dbName` sui relationship** → la colonna fisica resta `item_category_2_id` (convenzione `<campo>_id`); il campo Payload è `item_category_2` (Espansione). Migration rename `20260814_item_category_2_column` rimossa (annullata).
- **Collection `categories` ripristinata** (CRUD dashboard `/dashboard/categories`): `Products.item_category_3` da enum → **relationship → categories**; migration `20260814_categories_collection` (create tabella + seed Spc/Box/Bundle/Etb/Tin/Singola/Slab/Altro + migrazione dati enum→id + drop enum + rels Payload). Filtro shop "Micro prodotto" **dinamico** dalla collection.
- **Semplificazione stato**: via `status` e `is_preorder` (migration `20260814_remove_status_preorder`, drop colonne+enum); hook beforeChange → availability solo da quantity; via route `/shop/preorders`, filtri `status` dalle query storefront (resta `is_visible` + availability per "Esaurito"); overview prodotti ora conta `in_stock`/`out_of_stock`.

**Dashboard**:
- **Slug inglesi** (etichette italiane invariate): `/dashboard/settings` (impostazioni), `/dashboard/expansions` (espansioni), `/dashboard/listings` (listati), `/dashboard/categories` — redirect 308 dai vecchi slug (next.config).
- **Modale modifica minimale**: via slug, disponibilità (auto), stato, pre-ordine; resta titolo, prezzo/barrato, immagine, descrizione, dettagli carta, sezione Google.
- **"(OOS)" → "Esaurito"** ovunque.
- **/listings**: colonne Prezzo e Costo medio invertite (entrambe le viste), via colonna Stato (prodotti).
- **Tabelle uniformi stile /listings**: `SortableTh` + `useSort` + `useSortedList` in `ui/` condivisi; header ordinabili ovunque (Magazzino/Lotti server-side via sortBy/sortDir nelle action; Ordini/Messaggi/Espansioni/Categorie client-side); via dropdown filtri; search live (debounce, senza Cerca) in Magazzino e Lotti; Messaggi convertiti da card-list a tabella ordinabile con riga espandibile.

**Test**: unit 78/78 (product-filters micro per id, DTO senza status/preorder) · E2E aggiornati (route inglesi, modale minimale, Esaurito senza OOS, badge) + redirect `/dashboard/listati`→`/dashboard/listings` · **suite 52/52** su bundle prod · drift-check NESSUNO.

### Note
- La creazione prodotti avviene via Lotti (quick-create con Macro prodotto / Espansione / Micro prodotto dinamico).
- I dati `categories` vecchi (collection rimossa a fine sessione precedente) erano già migrati in `item_category_3`; ora `categories` è la collection che li espone in CRUD.
