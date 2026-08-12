// Valida il percorso legacy della migration 20260812: crea un DB con il modello
// flat originale (purchases.title/cost_of_goods_sold/quantity/store/.../linked_product_id),
// inserisce un lotto legacy e verifica che up() converta tutto in purchases_lines.
import fs from 'node:fs'
import pg from 'pg'

const CONN = process.env.LEGACY_DB || 'postgresql://edoardocavalcanti@localhost:5432/dcc_mig_legacy'
const file = fs.readFileSync('src/migrations/20260812_purchases_lines_schema.ts', 'utf8')
const upMatch = file.match(/export async function up[\s\S]*?sql`([\s\S]*?)`/)
if (!upMatch) {
  console.error('SQL up non trovato')
  process.exit(1)
}
const sqlUp = upMatch[1]

const SETUP = `
  CREATE TABLE IF NOT EXISTS "products" ("id" serial PRIMARY KEY, "title" varchar NOT NULL, "quantity" numeric DEFAULT 1);
  DO $$ BEGIN
    CREATE TYPE "enum_purchases_status" AS ENUM('received','pending','archived');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS "purchases" (
    "id" serial PRIMARY KEY,
    "title" varchar NOT NULL,
    "cost_of_goods_sold" numeric NOT NULL,
    "quantity" numeric NOT NULL DEFAULT 1,
    "store" varchar,
    "purchase_date" timestamp(3) with time zone,
    "notes" varchar,
    "linked_product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
    "status" "enum_purchases_status" DEFAULT 'received',
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "orders" (
    "id" serial PRIMARY KEY,
    "transaction_id" varchar NOT NULL,
    "email" varchar NOT NULL,
    "status" varchar DEFAULT 'paid',
    "value" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "orders_items" (
    "id" serial PRIMARY KEY,
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE SET NULL,
    "quantity" numeric NOT NULL,
    "price" numeric NOT NULL
  );
`

async function main() {
  const client = new pg.Client({ connectionString: CONN })
  await client.connect()
  await client.query('DROP TABLE IF EXISTS orders_items CASCADE')
  await client.query('DROP TABLE IF EXISTS orders CASCADE')
  await client.query('DROP TABLE IF EXISTS purchases_lines CASCADE')
  await client.query('DROP TABLE IF EXISTS purchases CASCADE')
  await client.query('DROP TABLE IF EXISTS products CASCADE')
  await client.query(SETUP)

  const p = await client.query(`INSERT INTO "products" ("title", "quantity") VALUES ('Legacy Booster', 10) RETURNING "id"`)
  const pid = p.rows[0].id
  await client.query(
    `INSERT INTO "purchases" ("title", "cost_of_goods_sold", "quantity", "store", "purchase_date", "linked_product_id", "status")
     VALUES ('Legacy Booster', 30, 10, 'Legacy Shop', now(), $1, 'received')`,
    [pid],
  )
  const inserted = await client.query('SELECT id FROM purchases')
  const purchaseId = inserted.rows[0].id

  console.log('Running migration up() on legacy DB...')
  await client.query(sqlUp)

  const lines = await client.query('SELECT _parent_id, product_id, quantity, unit_cost, effective_unit_cost, remaining_quantity FROM purchases_lines')
  console.log('Lines after migration:', JSON.stringify(lines.rows))
  const src = await client.query('SELECT source_name, source_type, total_cost FROM purchases')
  console.log('Purchase after migration:', JSON.stringify(src.rows))

  const ok =
    lines.rows.length === 1 &&
    Number(lines.rows[0]._parent_id) === purchaseId &&
    Number(lines.rows[0].product_id) === pid &&
    Number(lines.rows[0].quantity) === 10 &&
    Number(lines.rows[0].unit_cost) === 30 &&
    Number(lines.rows[0].remaining_quantity) === 10 &&
    src.rows[0].source_name === 'Legacy Shop' &&
    src.rows[0].source_type === 'other' &&
    Number(src.rows[0].total_cost) === 300

  console.log(ok ? 'LEGACY MIGRATION OK' : 'LEGACY MIGRATION WRONG RESULT')
  await client.end()
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error('LEGACY MIGRATION FAILED:', err?.message ?? err)
  process.exit(1)
})
