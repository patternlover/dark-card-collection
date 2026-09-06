# Sessione 2026-09-06 — Import storico acquisti + vendite

> Export Google Sheet: `purchases.csv` (41 lotti PUR-0001→0041) + `sales.csv`
> (40 ordini ORD-0001→0040 + righe template ignorate). CSV in `apps/backend/.import/`
> (gitignored, mai committati).

## Plan

**Regole approvate:** costo = `unitary_gross` · identità prodotto = nome+categoria+set+
lingua+condizione · prodotti **draft senza prezzi** · collection = primo set +
`metadata.set_names` per i multi-set · normalizzazioni: PUR-0016→Bundle,
Serie 3→CRI+PBL, PUR-0022-07→PUR-0022-01 · ORD-0026/27 (senza prezzo) saltati.

**Script** (`apps/backend/src/scripts/import-history/`):
- `csv.ts` — parser (gestisce anche righe interamente quotate con escape `""`).
- `parse.ts` — mapping + validazioni pure (quadratura net, range unità, no doppi,
  costo vendita vs acquisto). Test in `__tests__/parse.unit.spec.ts`.
- `report.ts` — report puro senza DB (`tsx .../report.ts`).
- `run.ts` — `npx medusa exec` (dry-run default, `COMMIT=1` per scrivere):
  ensure categorie/collezioni/opzione/prodotti(draft)+varianti+SKU → verifica
  inventory item → lotti in ordine di data via `createPurchaseLotWorkflow` →
  vendite in ordine di data via `recordExternalSaleWorkflow` (raggruppate per
  ordine, metadata `dcc_sale_id/sale_date/platform`) → quadratura finale.
  Idempotente via `[PUR-xxxx]` in notes e `dcc_sale_id` (rilanciabile).
- Tweak additivo: `order_metadata?` in `RecordExternalSaleWorkflowInput`.

**Report dry-run (reale):** 0 errori · 14 prodotti · 41 lotti · 38 ordini · 40 unità
vendute · 165 acquistati − 40 venduti = **125 residui** · costo €4727,39 ·
ricavi €1547,36.

## Changelog

- Parser + runner + test scritti e verificati in locale (jest 10/10 nuovi,
  backend `tsc` 0 errori). E2E locale su DB dev non eseguibile (Postgres WSL
  solo su 127.0.0.1 interno, irraggiungibile da Windows).
- **Esecuzione PROD delegata al VPS** (comandi sotto). Prima: backup Neon
  (PITR attivo di default + `backup-medusa.sh`).

### Comandi VPS (in `/opt/dcc`, backend aggiornato con `git pull`)

```bash
cd /opt/dcc/apps/backend
# 1) CSV in .import/ (purchases.csv + sales.csv)
# 2) dry-run (nessuna scrittura)
docker compose -f docker-compose.prod.yml run --rm api npx medusa exec ./src/scripts/import-history/run.ts
# 3) commit
docker compose -f docker-compose.prod.yml run --rm api \
  -e COMMIT=1 npx medusa exec ./src/scripts/import-history/run.ts
```

### Verifica post-import (attesa)

- `[verify] ... residui FIFO su DB: 125` (165 − 40) senza errori di quadratura.
- Admin → Lotti: 41 lotti · Prodotti: 14 (+1 demo) · Ordini: 38 completed
  canale Vinted con snapshot costo · Magazzino: es. Fascio Bundle 50−13=37,
  Serie 3 43−8=35, Serie 2 31−11=20.
- Margini: confronto spot profit foglio vs widget Admin (es. ORD-0018: 110−70=40).

## Esecuzione reale 2026-09-06 (sera) — COMPLETATA SU PROD

Eseguito da locale contro Neon prod via `apps/backend/.env.prod`
(loader in `.import/load-env.ps1`, gitignored; Redis in-memory).

**Run 1 (parziale):** catalogo ok (6 categorie, 12 collezioni, 14 prodotti DCC-0001→14),
lotti bloccati — `adjustInventory` non fa upsert dei level → aggiunta creazione
livelli a 0 nel runner. Il run aveva già creato il lotto PUR-0001 senza adjust.
**Run 2:** 40 lotti creati + self-heal; ordini bloccati — `createOrderWorkflow`
richiede prodotto **published** → i 14 prodotti sono published (ma SENZA sales
channel e SENZA prezzi: invisibili sullo storefront; il listino assegnerà
prezzi + canale Website).
**Run 3:** 38 ordini creati, quadratura 125/125 — MA margini FIFO ≠ foglio
(es. ORD-0004: 0,00 vs 19,43). Decisione utente: allocazione per lotto.
**Run 4 (ROLLBACK=1):** 38 ordini rimossi (restore FIFO + magazzino + delete;
display_id bruciati = buchi innocui), ricreazione fallita per bug early-return.
**Run 5:** 38 ordini ricreati con `lot_id` (`consumeFromLot` nel service,
branch nel workflow) — quadratura 125/125, **margini = foglio**
(ORD-0004: 19,43 · ricavi €1547,36 esatti · 0 prodotti visibili).

Stato finale prod: 14 prodotti published/invisibili · 41 lotti · 38 ordini Vinted
completed con snapshot per-lotto · 125 pezzi residui · costo €4727,39.

## Listino sito da inventory.csv — APPLICATO SU PROD

`inventory.csv` (165 righe unità: stato SOLD/LISTED/HOLD, target_price, image_url).
Script `src/scripts/import-history/listino.ts` (dry-run/COMMIT):
- prezzo = `target_price` più recente, altrimenti costo_max × 1.5 (margine ≥50%);
- canale Website solo con unità LISTED residue (HOLD nascosti + `metadata.hold_until`);
- thumbnail Cardmarket dove presente; idempotente via `metadata.listino_applied`.
- Prezzi via pricing `createPriceSets` + link SQL `product_variant_price_set`
  (`link.create` ambiguo) · canale via `linkProductsToSalesChannelWorkflow`.

**Applicato:** 7 visibili (Serie 2 €26,90 · Serie 3 €32,85 · Fascio €46,43 ·
Victini €35,90 · Gengar €29,90 · Crepuscolo €69,90 · Feraligatr €30,26),
4 nascosti con prezzo (SPC/Poster/Emboar/Meganium, hold), 3 esauriti saltati
(Palkia/Fiamme/Vaporeon). Verificato su shop live + PDP.
Note: stock pooled per variante (HOLD delle listed vendibili); 2 unità fantasma
in stock (PUR-0001-01, PUR-0027-01: foglio SOLD senza prezzo) da sistemare
quando il foglio avrà i prezzi; Vaporeon LISTED ma esaurito (foglio stale).

## Epilogo shop vuoto (2026-09-06) — NESSUN BUG

Segnalazione "non vedo gli item sul sito": diagnosi (feed vuoto + filtri popolati
+ nessun tocco Admin sul catalogo) + conferma utente = **demo cancellato a mano**,
unico prodotto visibile. Verifica read-only (`verify-shop.ts`): 14/14 intatti,
published, 0 canali, 1 variante. Shop a 0 = comportamento corretto.
Il listino (prezzi + canale Website) li renderà visibili.
