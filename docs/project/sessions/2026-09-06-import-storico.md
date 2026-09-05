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
- Admin → Lotti: 41 lotti · Prodotti: 14 (+1 demo) draft · Ordini: 38 completed
  canale Vinted con snapshot costo · Magazzino: es. Fascio Bundle 50−13=37,
  Serie 3 43−8=35, Serie 2 31−11=20.
- Margini: confronto spot profit foglio vs widget Admin (es. ORD-0018: 110−70=40).
