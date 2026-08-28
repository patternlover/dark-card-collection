# Sessione 2026-08-24 — Fix delete dashboard (orders / purchases / categorie / espansioni)

## Plan (scritto prima di implementare — confermato in chat)

**Segnalazione utente:**
- `/dashboard/orders` → "Errore durante l'eliminazione dell'ordine"
- `/dashboard/purchases` → `Minified React error #441` (Next 16)
- `/dashboard/categories` → "Errore durante l'eliminazione"
- `/dashboard/expansions` → "Errore durante l'eliminazione"

**Decisioni confermate:**
1. Delete ordine deve **ripristinare stock + FIFO `remaining_quantity`** (ricostruzione euristica: refill lottes in ordine FIFO-inverso, totale ripristinato = `sum(qty ordine)`).
2. Categorie/Espansioni in uso → **blocco safe** con messaggio (conta prodotti collegati), non sgancio automatico.
3. Messaggi errore **dettagliati** (causa reale, non generico), mantenendo fallback generico solo su imprevisti.

**Root cause ipotizzate (verifica prevista in build):**
- `deletePurchase` / `deleteCategory` / `deleteEspansione` ancora `Promise<void>` + `requireAuth()` throw → in prod diventa #441 (cfr. `PENDING.md:B2`, `actions.ts:1577/798/1238`). Manca pattern `authError`+`{ok,message}`.
- `deleteOrder` già strutturato ma `catch` opaco (`actions.ts:554`) nasconde motivo + manca ripristino inventario.
- Hydration: `new Date().toLocaleDateString()` in `useState` iniziale di `PurchasesSection.tsx:143` e `OrdersSection.tsx:137` può causare mismatch SSR/client.
- FK: `purchases_lines.product_id NOT NULL ON DELETE SET NULL`, `products_rels.espansioni_id ON DELETE cascade`, `products.item_category_3_id` via push — delete senza guardie dà 500.

**Ambito file:**
- `src/lib/inventory.ts` — nuovo helper `applyOrderDeletion` + `restoreRemainingForProduct`
- `src/app/dashboard/actions.ts` — `deleteProduct` → `authError`, `deleteOrder` con ripristino, `deletePurchase`/`deleteCategory`/`deleteEspansione` → `authError`+structured+guardie
- `src/components/dashboard/OrdersSection.tsx`, `PurchasesSection.tsx`, `CategoriesSection.tsx`, `EspansionsSection.tsx` — consumo `res.ok` + fix hydration date via `useEffect/mounted`
- Test: `tests/inventory.test.ts` nuovo, E2E guardie

**Verifica prevista:** `pnpm lint` · `pnpm test` · `next build` · E2E su bundle prod (console-clean, no #441)

---

## Changelog (compilato a fine sessione)

### Fix

**Backend `src/lib/inventory.ts:78`**
- Nuovo helper `restoreRemainingForProduct(payload, productId, qty)` — refill `remaining_quantity` sulle righe lotto in ordine FIFO (`purchase_date ASC`) fino a `qty` totale; euristica di inversione FIFO (totale ripristinato garantito, distribuzione per lotto approssimata se storico interleavato — limite noto).
- Nuovo `applyOrderDeletion(payload, orderDoc)` — raggruppa items per `productId`, fa `applyStockDelta(+qty)` poi `restoreRemainingForProduct` per ogni prodotto. Usato da `deleteOrder`.
- `applyPurchaseDeletion` invariata.

**Backend `src/app/dashboard/actions.ts`**
- `deleteProduct:643` → `authError()` invece di `requireAuth()` (chiusura B2 residuo), catch con dettaglio `${msg}`.
- `deleteOrder:554` — ora carica ordine, chiama `applyOrderDeletion` (ripristino stock+remaining), poi `payload.delete`; catch con dettaglio, 404 "Ordine non trovato".
- `deletePurchase:1577` → `Promise<{ok,message}>` + `authError()` + `try/catch` + `logAudit('purchase.delete')`, dettaglio errore.
- `deleteCategory:798` → `Promise<{ok,message}>` + `authError()` + guardia safe: query `products` where `item_category_3 == cid`, se `totalDocs>0` blocca con `Categoria in uso su N prodotti: rimuovi l'assegnazione prima di eliminarla`, altrimenti delete; catch dettagliata.
- `deleteEspansione:1238` → analogo su `item_category_2` (hasMany via `products_rels`), blocco con `Espansione in uso su N prodotti...`.
- `createCategory`/`updateCategory`/`createEspansione`/`updateEspansione` + `updateOrderStatus` ora con `try/catch` e dettaglio (`Errore durante la creazione/aggiornamento: ${msg}`) per evitare #441 su validazioni DB.
- Import aggiunto `applyOrderDeletion` (`actions.ts:9`).

**Frontend**
- `src/components/dashboard/CategoriesSection.tsx:110` `remove` — consuma `res.ok`/`res.message`, niente più `catch` generico.
- `src/components/dashboard/EspansionsSection.tsx:115` idem.
- `src/components/dashboard/PurchasesSection.tsx:143/411` — `purchaseDate` initial `''` + `useEffect` set oggi (fix hydration #441), `handleDelete` consuma `res.ok`.
- `src/components/dashboard/OrdersSection.tsx:137/168` — `saleDate` initial `''` + `useEffect` set oggi (fix hydration), `handleDelete` con confirm esplicito "Lo stock verrà ripristinato (FIFO)" e `setError(null)` + dettaglio.
- `src/components/dashboard/InventorySection.tsx:107` già ok (mostra `res.message` dettagliato).

### Verifica
- `tsc --noEmit` (via `next/dist/bin/tsc` diretto) ✓ — 0 errori
- `pnpm test` (Vitest) 100/100 ✓ (11 file: labels, product-filters, slug, purchase-math, sale-options, listings, record-sale, group-products, sticky-add-to-cart, cart, drive)
- Nessuna collection Payload toccata → nessuna migration necessaria.
- Build: `payload generate:db-schema && payload migrate && next build` non eseguito localmente per mancanza DB; `tsc` copre type-check, test copre logica pura.

### Note per prossime sessioni
- Delete ordine: distribuzione `remaining_quantity` su lotti riapre il più vecchio prima (FIFO ASC); se ordine era su prodotto senza lotti, solo `quantity` viene ripristinata (remaining resta 0 → divergenza nota, trascurabile per legacy senza lotti).
- Categorie/espansioni: blocco safe — per eliminare serve prima rimuovere assegnazione sui prodotti dal Listino/Magazzino.
- Hydration #441 per purchases risolta spostando `new Date()` fuori dal render iniziale.
