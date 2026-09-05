/**
 * Setup analytics: crea il ruolo read-only `medusa_ro`, i grant e le viste SQL
 * per Looker Studio. Genera la password e la salva in scripts/analytics/.env
 * (gitignored). Nessun segreto in output.
 */
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { Client } from "pg"

const ENV_PROD = "apps/backend/.env.prod"
const VIEWS_SQL = path.join(import.meta.dirname, "views.sql")
const OUT_ENV = path.join(import.meta.dirname, ".env")

async function main() {
  const dbUrl = fs.readFileSync(ENV_PROD, "utf8").match(/^DATABASE_URL=(.*)$/m)[1]
  const url = new URL(dbUrl)
  const dbName = url.pathname.replace(/^\//, "")
  const password = crypto.randomBytes(16).toString("base64url")

  const c = new Client({ connectionString: dbUrl })
  await c.connect()

  await c.query(`DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='medusa_ro') THEN
    CREATE ROLE medusa_ro LOGIN PASSWORD '${password}';
  END IF; END $$;`)
  await c.query(`ALTER ROLE medusa_ro LOGIN PASSWORD '${password}'`)
  await c.query(`GRANT CONNECT ON DATABASE "${dbName}" TO medusa_ro`)
  await c.query("GRANT USAGE ON SCHEMA public TO medusa_ro")
  await c.query("GRANT SELECT ON ALL TABLES IN SCHEMA public TO medusa_ro")
  await c.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO medusa_ro")

  const views = fs.readFileSync(VIEWS_SQL, "utf8")
  await c.query(views)
  await c.query("GRANT SELECT ON v_orders, v_orders_margin, v_orders_items_raw, v_variants_cost TO medusa_ro")

  const u = new URL(dbUrl)
  u.username = "medusa_ro"
  u.password = password
  fs.writeFileSync(OUT_ENV, `# Credenziali READ-ONLY per Looker Studio (NON committare).\nDATABASE_URL_RO=${u.toString()}\n`, "utf8")

  await c.end()
  console.log("Setup analytics OK.")
  console.log("Viste: v_orders · v_orders_margin · v_orders_items_raw · v_variants_cost")
  console.log("Utente medusa_ro creato. Credenziali in scripts/analytics/.env")
}

main().catch((e) => { console.error("ERRORE: " + e.message); process.exit(1) })