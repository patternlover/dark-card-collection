// Valida l'up della migration 20260812_purchases_lines_schema: estrae l'SQL
// (template statico) e lo esegue sul DB locale (schema post-push) per verificare
// sintassi e idempotenza (IF NOT EXISTS / IF EXISTS).
import fs from 'node:fs'
import pg from 'pg'

const file = fs.readFileSync('src/migrations/20260812_purchases_lines_schema.ts', 'utf8')

// estrae il contenuto del template sql`...` nella funzione up
const upMatch = file.match(/export async function up[\s\S]*?sql`([\s\S]*?)`/)
if (!upMatch) {
  console.error('SQL up non trovato')
  process.exit(1)
}
const sqlUp = upMatch[1]

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://edoardocavalcanti@localhost:5432/dcc_test' })
  await client.connect()
  console.log('Executing migration up() SQL...')
  await client.query(sqlUp)
  console.log('MIGRATION OK')
  await client.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('MIGRATION FAILED:', err?.message ?? err)
  process.exit(1)
})
