# Sessione — Rivisitazione modali dashboard

Data: 2026-08-12
Branch: `feat/dashboard-modals-redesign`

## Plan

### Obiettivo
Rivisitare i modali di inserimento/modifica dati delle sezioni del `/dashboard`, step by step su indicazione dell'utente. Toccare SOLO i modali e ciò che serve (niente refactor speculativi).

### Ambito (sezione per sezione, una alla volta)
1. **Ordini → Vendita Esterna** (step corrente): select Prodotto raggruppato per `title`, stock disponibile vicino a ogni voce, voci separate con attributo discriminante (grade/condition/language) in etichetta quando lo stesso nome esiste in più varianti DB. Niente anteprima immagine (rimandata ad altri modali).
2. **Magazzino → Nuovo/Duplica Prodotto** (`CreateProductModal`)
3. **Listino → Modifica Prodotto** (`EditProductModal`)
4. **Lotti → Registra/Modifica Lotto** (`PurchasesSection`)
5. **Categorie / Collezioni** (modali inline)
6. Eventuali altri modali richiesti dall'utente

### File coinvolti (step 1)
- `src/lib/sale-options.ts` (nuovo) — logica pura di raggruppamento/etichette per il select
- `src/components/dashboard/OrdersSection.tsx` — select Vendita Esterna con optgroup
- `tests/sale-options.test.ts` (nuovo) — unit test

### Verifica prevista
- `pnpm lint` + `pnpm test`
- E2E `tests-e2e/orders.spec.ts`
- Test manuale su `pnpm dev` (login Google locale)
- Commit su branch (nessun push finché richiesto)

## Changelog

### Step 1 — Vendita Esterna (2026-08-12)
- Creato branch `feat/dashboard-modals-redesign` da main (working tree pulito)
- `src/lib/sale-options.ts` (nuovo): `buildSaleOptions` raggruppa per `title`; 1 prodotto → opzione `"Nome (stock N)"`; N varianti → `<optgroup label="Nome">` con opzioni `"Nome · <discriminante> (stock N)"`. Discriminante scelto per gruppo dal primo attributo che differisce: `grade` (Mint/Near Mint/…) → `condition` (Nuovo/Usato/…) → `language` (Italiano/…). Varianti ordinate per lingua (italian→english→chinese→japanese) poi prezzo (come `groupProducts`); gruppi ordinati alfabeticamente per titolo.
- `OrdersSection.tsx`: mapping `openExternal` esteso con `grade`, `condition`, `language`; render del `<Select>` Prodotto con `<optgroup>`; comportamento invariato (auto-fill prezzo dal prodotto scelto, `max` qty = stock del selezionato, `recordExternalSale` identico).
- `tests/sale-options.test.ts` (nuovo, 6 test): opzione singola con stock, optgroup con grade, fallback condition/language, ordinamento varianti (lingua+prezzo) e gruppi (alfabetico).
- Verifica: `pnpm lint` ✓ · `pnpm test` 66/66 ✓ · E2E `tests-e2e/orders.spec.ts` 3/3 ✓ (nuovo select optgroup incluso)
- Commit `24e0070` sul branch (niente push — attesa user)

### Step successivi
- [ ] Magazzino → Nuovo/Duplica Prodotto (`CreateProductModal`)
- [ ] Listino → Modifica Prodotto (`EditProductModal`)
- [ ] Lotti → Registra/Modifica Lotto (`PurchasesSection`)
- [ ] Categorie / Collezioni (modali inline)

