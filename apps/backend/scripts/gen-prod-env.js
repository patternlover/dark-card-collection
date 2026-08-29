const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const hex = () => crypto.randomBytes(32).toString("hex")

const content = `# GENERATO automaticamente da scripts/gen-prod-env.js (NON committare).
# Compila i valori mancanti (DATABASE_URL, Stripe, Resend) e copia sul VPS come .env.prod.
DATABASE_URL=postgres://<user>:<pass>@<host>.neon.tech/dcc_medusa?sslmode=require
REDIS_URL=redis://redis:6379
JWT_SECRET=${hex()}
COOKIE_SECRET=${hex()}
AUTH_MFA_ENCRYPTION_KEY=${hex()}
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STORE_CORS=https://darkcardcollection.com
ADMIN_CORS=https://medusa.darkcardcollection.com,https://darkcardcollection.com
AUTH_CORS=https://medusa.darkcardcollection.com,https://darkcardcollection.com
RESEND_API_KEY=
EMAIL_FROM=noreply@darkcardcollection.com
`

const out = path.join(__dirname, "..", ".env.prod")
fs.writeFileSync(out, content, "utf8")
console.log(`.env.prod generato: ${out}`)
console.log("Compila: DATABASE_URL (da scripts/create-neon-db.sh), STRIPE_*, RESEND_API_KEY.")