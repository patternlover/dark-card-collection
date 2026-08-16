import { google } from 'googleapis'
import { Readable } from 'stream'

export interface DriveReceipt {
  fileId: string
  name: string
  url: string
}

/**
 * Normalizza la private key del service account nei formati accettabili:
 * - JSON del service account (chiave `private_key`, `client_email`)
 * - PEM con `\n` escaped (formato env standard)
 * - PEM con newline reali o virgolette ai bordi
 * Ritorna anche `client_email` quando disponibile (JSON).
 */
export function normalizePrivateKey(raw: string): { key: string; clientEmail?: string } {
  let key = raw.trim()
  let clientEmail: string | undefined
  if (key.startsWith('{')) {
    try {
      const parsed = JSON.parse(key)
      if (typeof parsed.private_key === 'string') key = parsed.private_key
      if (typeof parsed.client_email === 'string') clientEmail = parsed.client_email
    } catch {
      // lascia il valore così com'è
    }
  }
  key = key.replace(/^"+|"+$/g, '').replace(/\\n/g, '\n').trim()
  return { key, clientEmail }
}

/**
 * Sceglie l'email del service account per il JWT.
 * Con chiave JSON il `client_email` interno è per costruzione coerente con la
 * private_key (stesso file scaricato da Google) → ha la precedenza sull'env.
 * L'env GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL è usato solo come fallback (PEM puro).
 */
export function resolveAccountEmail(envEmail: string | undefined, clientEmail: string | undefined): string {
  const candidate = (clientEmail || envEmail || '').trim()
  if (!candidate) {
    throw new Error(
      'Google Drive non configurato: manca GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL (o client_email nel JSON della chiave)',
    )
  }
  if (!/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(candidate)) {
    throw new Error(
      'Google Drive: GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL deve essere il client_email del service account (es. nome@progetto.iam.gserviceaccount.com), non un account personale',
    )
  }
  return candidate
}

export function getDriveClient(): { drive: ReturnType<typeof google.drive>; folderId: string } | null {
  const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!privateKey || !folderId) return null

  const { key, clientEmail } = normalizePrivateKey(privateKey)
  const accountEmail = resolveAccountEmail(email, clientEmail)

  const auth = new google.auth.JWT({
    email: accountEmail,
    key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })

  return { drive: google.drive({ version: 'v3', auth }), folderId }
}

/**
 * Upload a receipt file (image or PDF) to the shared Google Drive folder.
 * Returns the file id, original name and web view link.
 */
export async function uploadReceiptToDrive(file: File): Promise<DriveReceipt> {
  const client = getDriveClient()
  if (!client) {
    throw new Error('Google Drive non configurato: mancano GOOGLE_DRIVE_* env')
  }
  const { drive, folderId } = client

  const safeName = (file.name || `scontrino-${Date.now()}`).replace(/[^\w.\- ]+/g, '_')
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'

  try {
    const res = await drive.files.create({
      requestBody: {
        name: safeName,
        parents: [folderId],
        mimeType,
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id,name,webViewLink',
    })

    const data = res.data
    if (!data.id) {
      throw new Error('Upload scontrino fallito: nessun file id')
    }

    return {
      fileId: data.id,
      name: data.name || safeName,
      url: data.webViewLink || '',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('invalid_grant')) {
      throw new Error(
        'Google Drive: autenticazione rifiutata. Verifica che GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL (su Vercel) sia il client_email del service account, o lasciala vuota quando la chiave è il JSON completo (il client_email viene estratto da lì)',
      )
    }
    throw err
  }
}
