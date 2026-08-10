# Sessione 2026-08-10 — Modulo Acquisti (Purchases) e Vendite Esterne

## Plan (pre-lavoro)

**Obiettivo**: Introdurre la gestione degli acquisti (fornitori, edicole, supermercati, prezzi di costo) con carico automatico nel catalogo/inventario (`Products`), e aggiungere la gestione delle vendite esterne (Vinted, Wallapop, eBay, ecc.) direttamente dalla dashboard prodotti (`/dashboard/prodotti`) con tracciamento della piattaforma, quantità e prezzo di vendita effettivo.

**Ambito**:
1. **Collection `Purchases` (`acquisti`) in Payload CMS**:
   - Campi: `title`, `cost_of_goods_sold`, `quantity`, `store`, `purchase_date`, `notes`, `linked_product`, `status`.
2. **Flusso Acquisti $\rightarrow$ Inventario**:
   - Da `/dashboard/acquisti`, registrando un acquisto si crea il record di acquisto e, se non esiste in catalogo, viene creato automaticamente il prodotto in inventario (`Products`) con i relativi dati anagrafici e di costo.
3. **Sezione Dashboard `/dashboard/acquisti`**:
   - Tabella acquisti, ricerca, paginazione, modale creazione/modifica acquisto.
4. **Vendite Esterne (`/dashboard/prodotti`)**:
   - Pulsante "Registra vendita esterna" su ogni lotto.
   - Modale che richiede: Quantità venduta, Piattaforma (Vinted, Wallapop, eBay, Subito, Altro) e Prezzo di vendita effettivo.
   - Aggiornamento della quantità del lotto e registrazione nei dati ordini/vendite.
5. **Database & Migrazioni**:
   - Registrazione collection in `payload.config.ts`, generazione tipi (`payload generate:types`) e migrazione DB.

**File coinvolti**:
- `src/payload/collections/Purchases/index.ts`
- `src/payload.config.ts`
- `src/app/dashboard/actions.ts`
- `src/app/dashboard/acquisti/page.tsx`
- `src/components/dashboard/PurchasesSection.tsx`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/dashboard/ProductGroupRow.tsx`
- `src/components/dashboard/ProductTable.tsx`
- `src/components/dashboard/ExternalSaleModal.tsx`
- `docs/project/changelog.md`, `docs/project/sessions/*`

**Verifica prevista**: `pnpm lint`, `pnpm test`, `payload generate:db-schema && payload migrate && next build`.

## Changelog (post-lavoro)

1. **Collection `Purchases`**: Creata la nuova collection in Payload CMS (`src/payload/collections/Purchases/index.ts`) e registrata in `payload.config.ts`. Tipi rigenerati (`payload generate:types`). ✅
2. **Dashboard Acquisti (`/dashboard/acquisti`)**: Aggiunta la sezione di gestione acquisti con tabella, ricerca, paginazione e modale di registrazione acquisto che carica automaticamente il prodotto nel catalogo/inventario (`Products`). ✅
3. **Vendite Esterne**: Integrato il modale `ExternalSaleModal` e il pulsante dedicato in `ProductTable` e `ProductGroupRow`. Consente di registrare vendite su piattaforme esterne (Vinted, Wallapop, eBay, Subito, Altro), specificando quantità e prezzo effettivo di vendita, aggiornando lo stock e inserendo l'ordine in `Orders`. ✅
4. **Navigazione Dashboard**: Aggiunta la voce "Acquisti" in `DashboardShell`. ✅
5. **Verifica**: Test unitari passati (26/26). ✅
