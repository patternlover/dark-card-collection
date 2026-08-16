/**
 * Genera l'URL di autorizzazione OAuth per Google Drive (account personale)
 * e, dato il code di ritorno, scambia il refresh token.
 *
 * Uso:
 *   1) pnpm exec tsx scripts/drive-auth.ts url
 *      → apre l'URL nel browser, autorizzi con il tuo account Google
 *   2) copia il "code" dall'URL di redirect (http://localhost/?code=...)
 *   3) pnpm exec tsx scripts/drive-auth.ts token <CODE>
 *      → stampa il GOOGLE_DRIVE_REFRESH_TOKEN da mettere in .env.local e Vercel
 */
import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

function loadEnvSimple(file: string) {
  const content = fs.readFileSync(file, 'utf8')
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    if (!key.startsWith('GOOGLE_DRIVE')) continue
    let value = line.slice(idx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    process.env[key] = value
  }
}

function getClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('Mancano GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET in .env.local')
    process.exit(1)
  }
  return new google.auth.OAuth2(clientId, clientSecret, 'http://localhost')
}

async function main() {
  loadEnvSimple(path.resolve(process.cwd(), '.env.local'))

  const mode = process.argv[2]
  const client = getClient()

  if (mode === 'url') {
    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.file'],
    })
    console.log('Apri questo URL e autorizza col tuo account Google:')
    console.log('\n' + url + '\n')
    console.log('Dopo l\'autorizzazione il browser tenterà di aprire http://localhost/?code=...')
    console.log('Copia il valore di "code" dall\'URL e lancia:')
    console.log('  pnpm exec tsx scripts/drive-auth.ts token <CODE>')
    process.exit(0)
  }

  if (mode === 'token') {
    const code = process.argv[3]
    if (!code) {
      console.error('Uso: pnpm exec tsx scripts/drive-auth.ts token <CODE>')
      process.exit(1)
    }
    const { tokens } = await client.getToken(code)
    if (!tokens.refresh_token) {
      console.error('Nessun refresh_token ricevuto. Riprova (l\'URL deve essere generato con access_type=offline).')
      process.exit(1)
    }
    console.log('\nGOOGLE_DRIVE_REFRESH_TOKEN=' + tokens.refresh_token)
    console.log('\nAggiungi questa riga a .env.local e come env su Vercel.')
    process.exit(0)
  }

  console.error('Uso: pnpm exec tsx scripts/drive-auth.ts url | token <CODE>')
  process.exit(1)
}

main().catch((err) => {
  console.error('ERROR:', err instanceof Error ? err.message : err)
  process.exit(1)
})
