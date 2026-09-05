# Sessione 2026-09-06 — Admin italiano: Lotti usabile (P1) + dizionario IT (P5)

> Richiesta: backend usabile da non-tecnici, solo italiano, guida in Admin.
> Scelte: operatività prima · guida in Admin (P4) dopo P1+P5.

## Plan (scritto prima di iniziare)

**P5 — dizionario IT centralizzato** (`apps/backend/src/admin/i18n/`): `it.json` + `en.json`
con testo italiano in entrambi (la dashboard segue la lingua del browser, il core resta
inglese; le pagine custom restano sempre italiane). Chiavi `common.*` + `lots.*`.

**P1 — pagina Lotti usabile** (`apps/backend/src/admin/routes/lots/page.tsx`): mai più
`variant_id` a mano. Nuovo endpoint `GET /admin/dcc/variant-options` (query module
prodotti/varianti + giacenza FIFO dal modulo procurement) → dropdown con nome prodotto,
variante, SKU e giacenza + ricerca live. Validazione in italiano, anteprima costo
effettivo pro-quota (stessa formula del backend) e totale lotto, storico con nomi
prodotti invece di id.

**Verifica prevista:** backend `tsc` + jest · storefront `lint/test/build` (Vercel-safe).

## Changelog

- `src/admin/i18n/json/it.json` + `en.json` (identici, vedi sopra) · `index.ts` li esporta.
- `src/api/admin/dcc/variant-options/route.ts` (nuovo): `{options, count}` con
  `variant_id, product_title, variant_title, sku, status, stock` (FIFO).
- `src/admin/routes/lots/page.tsx` riscritta: `useTranslation`, selettore prodotti con
  ricerca, validazione IT, anteprima costi, data default oggi, messaggi esito.
- Nota: import JSON senza `with {type:"json"}` (il tsconfig backend non supporta gli
  import attributes — TS2823).

**Verifica:** backend `tsc` 0 errori · jest 13/13 ✓ · storefront `lint` 0 · test 52/52 ·
`next build` ok (31 pagine) → build Vercel sicura (solo file backend toccati + docs).

**Prossimo (approvato in piano):** P2 vendita esterna UI · P3 widget magazzino · P4 guida
in Admin · modale pagamenti (skeleton compatto + prefetch).
