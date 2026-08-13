# Sessione 2026-08-13 — Listino: nome su una riga + stella in fondo riga + header uniforme

## Plan (scritto prima di implementare — confermato in chat)

**Obiettivo** (piccole modifiche `/dashboard/listings`):
1. Vista Gruppi: nome prodotto su **una riga** (`truncate` + ellissi, `title` col nome completo al hover); **stella inline rimossa** dal nome (quella in evidenza resta nel pulsante in fondo riga, già riempito quando attivo).
2. Vista Gruppi: **Costo medio** con `whitespace-nowrap` → altezze righe uniformi.
3. **Header su una riga** in entrambe le viste (`whitespace-nowrap` nel bottone di `SortableTh`); righe vista Prodotti invariate.

**File**: `src/components/dashboard/ListingsSection.tsx` · `tests-e2e/listings-groups.spec.ts` (rename test nomi) · docs.

**Verifica prevista**: lint · test · build · E2E bundle prod · commit su main → push → CI → deploy live.

---

## Changelog (compilato a fine sessione)

### Implementato (su main)
- **Vista Gruppi**: nome prodotto su **una riga** (`block truncate` + ellissi, `title={g.title}` con il nome completo al hover); **stella inline rimossa** dal nome (l'indicatore in evidenza resta nel pulsante stella in fondo riga, già riempito quando attivo).
- **Vista Gruppi**: cella **Costo medio** con `whitespace-nowrap` → righe tutte della stessa altezza.
- **Header su una riga** in entrambe le viste: bottone di `SortableTh` con `whitespace-nowrap` (niente wrap su "Disponibilità"/"Costo medio"). Righe vista Prodotti invariate.

### Test
- Unit: 69/69 (invariati).
- E2E: rinominato "product names shown on a single line" (assert visibilità + `title` attr col nome completo); suite completa **40/40** su bundle prod.

### Verifica
`pnpm lint` ✓ · `pnpm test` 69/69 ✓ · `next build` ✓ · **Playwright su bundle prod 40/40** ✓.
Nota: in una run della suite completa 3 test di `products.spec` (ultimi del file) erano falliti per esaurimento risorse del server di test locale (0 gruppi restituiti da `searchListings` sotto carico sostenuto): con server riavviato e heap 6144 la suite è verde 40/40; nessuna modifica di codice coinvolta.
