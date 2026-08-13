# Sessione 2026-08-12 — Listino: fix "Mostra" + homepage "In evidenza" (featured 4 slot)

## Plan (scritto prima di implementare — confermato in chat)

**Segnalazioni utente** (live `/dashboard/listings`):
1. Non si riesce a rendere visibile un prodotto nascosto con l'icona ("l'icona non cambia").
2. Domanda sugli item in evidenza: la homepage ha 4 slot ma la stella non li controlla.

**Root cause Issue 2 (chiara)**: `FeaturedProducts.tsx` mostra i 4 gruppi più recenti tra i visibili, **senza** filtro `featured`; la stella alimenta solo `/shop/bestsellers`.
**Fix Issue 2**:
- Homepage: `AND:[status in [...], is_visible true, featured {equals true}]` + `slice(0,4)`; **fallback** ai 4 più recenti se nessun gruppo è featured.
- Listino vista Gruppi: **contatore "In evidenza n/4"** (da `searchListings.featuredCount`) e **stella disabilitata** quando `featuredCount >= 4` e il gruppo non è featured.

**Issue 1 (riproduzione + hardening)**:
- Passo 1: E2E products-view "hide → show again" (icona Eye, messaggio, reload persistente, `/shop` lo mostra). Se rosso → causa esatta; se verde → hardening difensivo.
- Passo 2 hardening: `updateGroup`/`toggleVariantVisibility` → `ok:false` chiaro se 0 documenti aggiornati (oggi `updateGroup` risponde ok con 0 match → icona che "non cambia"); dopo un toggle riuscito → `load()` per stato autoritativo.

**File coinvolti**: `src/components/sections/FeaturedProducts.tsx` · `src/app/dashboard/actions.ts` · `src/lib/listings.ts` · `src/components/dashboard/ListingsSection.tsx` · `tests/listings.test.ts` · `tests-e2e/listings-groups.spec.ts` · docs.

**Verifica prevista**: lint · test · build · E2E bundle prod · commit su main → push → CI → deploy live → docs.

---

## Changelog (compilato a fine sessione)

### Issue 2 — Homepage "In evidenza" ora usa la stella (4 slot)
- `FeaturedProducts.tsx`: la homepage filtra `featured: { equals: true }` (con `is_visible` e `status in [listed,hold,sold]`), `groupProducts().slice(0, 4)`; se **0 gruppi featured** → fallback ai 4 più recenti (sezione mai vuota).
- Listino vista Gruppi: **contatore "In evidenza n/4"** nel header (da `searchListings.featuredCount`, calcolato su tutto il catalogo prima di filtri/paginazione) e **stella disabilitata** quando `featuredCount >= 4` e il gruppo non è in vetrina (tooltip "Slot in evidenza pieni (4/4)").

### Issue 1 — Hardening toggle visibilità
- `updateGroup`: se la ricerca per titolo restituisce **0 documenti** → `{ ok: false, message: 'Gruppo non trovato...' }` (prima rispondeva ok:true a vuoto → l'icona "non cambiava").
- `toggleVariantVisibility`: verifica `findByID` prima dell'update (prodotto non trovato → ok:false chiaro).
- `ListingsSection`: dopo un toggle **riuscito** (visibilità gruppo/variante, featured) → `load()` per stato autoritativo dal DB (mai stato ottimistico stantio).
- Nota: i fallimenti E2E visti in corso d'opera erano **flakiness da OOM del server di test** (`next start` senza heap), non da queste modifiche; con `NODE_OPTIONS=--max-old-space-size=4096` la suite è stabile.

### Test
- Unit: 63/63 (+`countFeaturedGroups`).
- E2E `listings-groups.spec.ts`: +2 casi → **"products view: hide→show"** (hide, show, reload persiste, `/shop` lo mostra) e **"featured slots: counter n/4, stella bloccata a 4, homepage mostra i featured"**.

### Verifica
`pnpm lint` ✓ · `pnpm test` 63/63 ✓ · `next build` ✓ · **Playwright su bundle prod 40/40** ✓ (console-clean senza errori hydration).

### Note
- Il "Mostra" lato DB funzionava già; i casi che sembravano rotti erano: homepage che non rifletteva la stella (risolto) e possibili stati ottimistici stantii (ora sempre riallineati con `load()`).
- Comportamento confermato: un prodotto con stock 0/status sold, reso visibile, compare come **"Esaurito"** sul sito (da chiarire se non desiderato).
