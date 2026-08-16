import { google } from 'googleapis'
import { Readable } from 'stream'

export interface DriveReceipt {
  fileId: string
  name: string
  url: string
}

function getDriveClient(): { drive: ReturnType<typeof google.drive>; folderId: string } | null {
  const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!email || !privateKey || !folderId) return null

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, '\n'),
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
}
