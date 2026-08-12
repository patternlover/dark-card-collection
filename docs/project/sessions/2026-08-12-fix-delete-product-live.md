# Sessione 2026-08-12 — Fix delete prodotto live (#441)

## Plan (scritto a inizio sessione)

**Segnalazione**: su `https://darkcardcollection.com/dashboard/inventory`, premendo "Elimina prodotto" compare `Minified React error #441` (stesso errore già visto in passato). "Come mai non va se i test erano positivi?"

**Obiettivo**: individuare la causa, riprodurla (non solo teorizzare), fixarla e coprire il caso con un test di regressione.

**Ambito**:
- `src/app/dashboard/actions.ts` → `deleteProduct`
- `src/components/dashboard/InventorySection.tsx` → `removeProduct`
- Test: riproduzione E2E sul bundle di produzione + test permanente in `tests-e2e/`

**Ipotesi iniziali** (da verificare, non assumere):
1. Il delete di prodotti con riferimenti FK (righe lotti / items ordini) fallisce lato DB → 500 → sintomo #441 (come sessione 11).
2. L'E2E esiste ma copre solo il delete di prodotti senza riferimenti → non coglie il caso live.
3. Verificare anche il comportamento Next 16 sulle server action che lanciano errori (i messaggi di validazione arrivano al client?).

**Verifica prevista**: `pnpm lint` · `pnpm test` · build + E2E su bundle prod · nuovo test di regressione.

---

## Changelog (compilato a fine sessione)

### Root cause (riprodotta, non teorizzata)

1. **FK**: `purchases_lines.product_id` e `orders_items.product_id` sono `NOT NULL` con vincolo `ON DELETE SET NULL` → `DELETE FROM products` fallisce con `null value in column "product_id" violates not-null constraint` se il prodotto è referenziato da una riga lotto o da un item ordine.
2. **500 → #441**: in produzione (Next 16.3 + React 19) un errore lanciato da una server action arriva al client come errore il cui messaggio è il testo minificato `Minified React error #441; visit https://react.dev/errors/441...` → l'Alert della dashboard mostra quel testo al posto di un messaggio utile. Riprodotto ESATTAMENTE con Playwright sul bundle di produzione: il corpo pagina conteneva letteralmente la stringa #441 nella posizione dell'Alert.
3. **Perché i test passavano**: `products.spec.ts` elimina solo un prodotto creato dal test stesso (zero riferimenti) → delete ok. I prodotti live hanno righe lotti/ordini → 500 → #441. Stessa catena causale documentata in sessione 11 (i 500 sulle write → #441).

### Fix

- **`deleteProduct` → risultato strutturato, mai throw** (`{ ok: boolean; message?: string }`):
  1. Ordini che referenziano il prodotto → blocco con messaggio chiaro (`Il prodotto risulta in ordini: elimina prima gli ordini collegati o nascondilo dal listino`) — mai toccare lo storico finanziario.
  2. Righe lotto con `remaining_quantity > 0` → blocco con messaggio chiaro (`Il prodotto ha stock residuo nei lotti: modifica o elimina prima i lotti collegati (sezione Lotti)`).
  3. Righe completamente consumate (remaining = 0) → rimosse dal lotto (kept lines preservano `id` e costi), poi delete del prodotto. Ramo difensivo: in pratica remaining=0 implica una vendita → ordine → blocco del punto 1.
  4. Qualsiasi errore imprevisto → `{ ok: false, message: 'Errore durante l'eliminazione del prodotto' }` (niente throw → niente #441).
- **`InventorySection.removeProduct`**: consuma `DeleteProductResult` — mostra il messaggio in caso di blocco, conferma + rimozione riga solo su `ok: true`.
- **Regressione**: `tests-e2e/product-delete-guard.spec.ts` (3 test sul bundle di produzione):
  - nessun riferimento → delete ok, niente #441;
  - stock residuo nei lotti → messaggio chiaro, riga resta, niente #441;
  - riferimento in ordini → messaggio chiaro, riga resta, niente #441.

### Nota sistemica (Next 16 server actions)

Qualsiasi server action che lancia errori di business (es. `createProduct` con titolo vuoto, `recordExternalSale`, `updateOrderStatus`) produce lo stesso #441 in produzione: il messaggio originale viene inghiottito e sostituito dal testo minificato. `deleteProduct` è ora a risultato strutturato; le altre andrebbero migrate allo stesso pattern in una sessione dedicata (task registrato in PENDING).

### Verifica

- `pnpm lint` ✓ (tsc --noEmit pulito)
- `pnpm test` 44/44 ✓
- `next build` ✓ (heap aumentato)
- Playwright su bundle di produzione: 31/31 ✓ (28 esistenti + 3 nuovi) — incl. `console-clean` (nessun errore hydration) e `products` (delete semplice)
- Riproduzione pre-fix: 500 confermato (dev e prod) + #441 renderizzato nel body (prod). Post-fix: messaggi chiari, zero 500, zero #441.

### Prossime sessioni

- Migrare le altre server action al pattern risultato-strutturato (niente throw) — vedi PENDING.
- Flusso utente B1 (cleanup legacy): con le guardie, i prodotti con lotti/ordini mostrano messaggi chiari; l'ordine sicuro resta: lotti → ordini → prodotti.
