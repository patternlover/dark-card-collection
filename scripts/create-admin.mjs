import crypto from 'crypto'
import pg from 'pg'

const { DATABASE_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

if (!DATABASE_URI) {
  console.error('[create-admin] DATABASE_URI mancante nelle env.')
  process.exit(1)
}

const email = ADMIN_EMAIL || 'admin@darkcardcollection.com'
const password = ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url')

// Stesso formato di Payload (auth/strategies/local/generatePasswordSaltHash)
const salt = crypto.randomBytes(32).toString('hex')
const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex')

const client = new pg.Client({ connectionString: DATABASE_URI })
await client.connect()

const existing = await client.query('SELECT id FROM users WHERE email = $1', [email])
if ((existing.rowCount ?? 0) > 0) {
  console.log(`[create-admin] Utente ${email} esiste gia (id ${existing.rows[0].id}), nessuna modifica.`)
  await client.end()
  process.exit(0)
}

await client.query(
  `INSERT INTO users (email, name, salt, hash, login_attempts, created_at, updated_at)
   VALUES ($1, $2, $3, $4, 0, now(), now())`,
  [email, 'Admin', salt, hash],
)
await client.end()

console.log(`[create-admin] Creato utente admin: ${email}`)
if (!ADMIN_PASSWORD) {
  console.log(`[create-admin] Password temporanea: ${password}`)
  console.log('[create-admin] Cambiala subito da https://darkcardcollection.com/admin (voce "Profilo" in alto a destra).')
}
