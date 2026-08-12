// Valida la migration 20260812_fix_locked_documents_rels:
// - su una fixture che riproduce lo stato rotto live (payload_locked_documents_rels
//   SENZA purchases_id) → la aggiunge con FK e indice;
// - idempotenza (seconda esecuzione no-op);
// - down → la rimuove.
import fs from 'node:fs'
import pg from 'pg'

const CONN = process.env.LOCK_DB || 'postgresql://edoardocavalcanti@localhost:5432/dcc_lock_fix'
const file = fs.readFileSync('src/migrations/20260812_fix_locked_documents_rels.ts', 'utf8')
const upMatch = file.match(/export async function up[\s\S]*?sql`([\s\S]*?)`/)
const downMatch = file.match(/export async function down[\s\S]*?sql`([\s\S]*?)`/)
if (!upMatch || !downMatch) {
  console.error('SQL up/down non trovati')
  process.exit(1)
}
const sqlUp = upMatch[1]
const sqlDown = downMatch[1]

async function main() {
  const client = new pg.Client({ connectionString: CONN })
  await client.connect()
  await client.query('DROP TABLE IF EXISTS payload_locked_documents_rels CASCADE')
  await client.query('DROP TABLE IF EXISTS purchases CASCADE')

  // fixture dello stato rotto live: tabella SENZA purchases_id + tabella purchases (per FK)
  await client.query(`CREATE TABLE "purchases" ("id" serial PRIMARY KEY);`)
  await client.query(`
    CREATE TABLE "payload_locked_documents_rels" (
      "id" integer PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer,
      "categories_id" integer,
      "collections_id" integer,
      "orders_id" integer,
      "media_id" integer,
      "messages_id" integer,
      "users_id" integer
    );
  `)

  const hasCol = (await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='purchases_id'`,
  )).rows.length
  console.log('BEFORE (purchases_id presente, atteso 0):', hasCol)

  console.log('Running up()...')
  await client.query(sqlUp)

  const after = (await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' ORDER BY ordinal_position`,
  )).rows.map((r) => r.column_name)
  const fk = (await client.query(
    `SELECT 1 FROM pg_constraint WHERE conname='payload_locked_documents_rels_purchases_fk'`,
  )).rows.length
  const idx = (await client.query(
    `SELECT 1 FROM pg_indexes WHERE indexname='payload_locked_documents_rels_purchases_id_idx'`,
  )).rows.length
  console.log('AFTER columns:', after.join(','))
  console.log('FK:', fk, 'IDX:', idx)

  // idempotenza: seconda esecuzione
  await client.query(sqlUp)
  console.log('IDEMPOTENT up(): OK')

  // down
  await client.query(sqlDown)
  const gone = (await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='purchases_id'`,
  )).rows.length
  console.log('AFTER DOWN (purchases_id presente, atteso 0):', gone)

  const ok = after.includes('purchases_id') && fk === 1 && idx === 1 && gone === 0
  console.log(ok ? 'LOCKED_DOCS MIGRATION OK' : 'LOCKED_DOCS MIGRATION WRONG')
  await client.end()
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error('LOCKED_DOCS MIGRATION FAILED:', err?.message ?? err)
  process.exit(1)
})
