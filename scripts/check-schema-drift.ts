// Confronta lo schema di due database PostgreSQL e segnala ogni drift
// (tabelle/colonne/FK/indici presenti nel riferimento ma assenti nel target, e viceversa).
// Uso:
//   SCHEMA_DRIFT_URI="postgresql://...live..." SCHEMA_DRIFT_REF_URI="postgresql://...ref(corretto)..." pnpm exec tsx scripts/check-schema-drift.ts
// Default: target = SCHEMA_DRIFT_URI | dcc_test, reference = SCHEMA_DRIFT_REF_URI | dcc_test.
import pg from 'pg'

const REF = process.env.SCHEMA_DRIFT_REF_URI || 'postgresql://edoardocavalcanti@localhost:5432/dcc_test'
const TARGET = process.env.SCHEMA_DRIFT_URI || 'postgresql://edoardocavalcanti@localhost:5432/dcc_test'

async function load(client: pg.Client) {
  const tables = new Set(
    (await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`,
    )).rows.map((r) => r.table_name),
  )
  const columns = new Map<string, Set<string>>()
  const cols = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`,
  )
  for (const r of cols.rows) {
    if (!columns.has(r.table_name)) columns.set(r.table_name, new Set())
    columns.get(r.table_name)!.add(r.column_name)
  }
  const fks = new Set(
    (await client.query(
      `SELECT conname FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace ORDER BY conname`,
    )).rows.map((r) => r.conname),
  )
  const idx = new Set(
    (await client.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname`,
    )).rows.map((r) => r.indexname),
  )
  return { tables, columns, fks, idx }
}

async function main() {
  const refC = new pg.Client({ connectionString: REF })
  const tgtC = new pg.Client({ connectionString: TARGET })
  await refC.connect()
  await tgtC.connect()
  const ref = await load(refC)
  const tgt = await load(tgtC)

  const problems: string[] = []
  for (const t of ref.tables) if (!tgt.tables.has(t)) problems.push(`TABLE mancante nel target: ${t}`)
  for (const t of tgt.tables) if (!ref.tables.has(t)) problems.push(`TABLE extra nel target (solo push?): ${t}`)
  for (const [t, cols] of ref.columns) {
    for (const c of cols) {
      if (!tgt.columns.get(t)?.has(c)) problems.push(`COLONNA mancante nel target: ${t}.${c}`)
    }
  }
  for (const f of ref.fks) if (!tgt.fks.has(f)) problems.push(`FK mancante nel target: ${f}`)
  for (const i of ref.idx) if (!tgt.idx.has(i)) problems.push(`INDEX mancante nel target: ${i}`)

  if (problems.length === 0) {
    console.log('SCHEMA DRIFT: NESSUNO (allineato al riferimento)')
  } else {
    console.log('SCHEMA DRIFT TROVATO:')
    problems.forEach((p) => console.log('  -', p))
    process.exitCode = 1
  }
  await refC.end()
  await tgtC.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
