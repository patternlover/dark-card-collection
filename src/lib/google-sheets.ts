import { google } from 'googleapis'

const SHEET_COLUMNS = 'A:S'

const CONDITION_REVERSE_MAP: Record<string, string> = {
  'mint': 'SEALED',
  'near-mint': 'NM',
  'lightly-played': 'EXC',
  'moderately-played': 'GD',
  'heavily-played': 'LP',
  'damaged': 'PL',
  'graded': 'PSA',
}

const LANGUAGE_REVERSE_MAP: Record<string, string> = {
  'italian': 'ITA',
  'english': 'ENG',
  'chinese': 'CIN',
  'japanese': 'JAP',
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null

function getSheetsClient() {
  if (sheetsClient) return sheetsClient

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT
  if (!serviceAccountJson) return null

  try {
    const credentials = JSON.parse(serviceAccountJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    sheetsClient = google.sheets({ version: 'v4', auth })
    return sheetsClient
  } catch {
    return null
  }
}

function getSheetId(): string | null {
  return process.env.GOOGLE_SHEET_ID || null
}

export async function findRowByItemId(itemId: string): Promise<number | null> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()
  if (!sheets || !spreadsheetId) return null

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `inventory!A:A`,
    })

    const rows = res.data.values || []
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]?.[0] === itemId) {
        return i + 1
      }
    }
    return null
  } catch {
    return null
  }
}

export async function updateRowByItemId(
  itemId: string,
  fields: Record<string, any>
): Promise<boolean> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()
  if (!sheets || !spreadsheetId) return false

  const rowNum = await findRowByItemId(itemId)
  if (!rowNum) return false

  const currentRow = await readRow(rowNum)
  if (!currentRow) return false

  const columnIndex: Record<string, number> = {
    product_name: 1,
    category: 2,
    language: 3,
    set: 4,
    condition: 5,
    product_state: 10,
    target_price: 13,
    image_url: 17,
  }

  const updatedRow = [...currentRow]

  for (const [field, value] of Object.entries(fields)) {
    const colIdx = columnIndex[field]
    if (colIdx === undefined) continue

    let csvValue = value

    if (field === 'condition' && CONDITION_REVERSE_MAP[value]) {
      csvValue = CONDITION_REVERSE_MAP[value]
    }
    if (field === 'language' && LANGUAGE_REVERSE_MAP[value]) {
      csvValue = LANGUAGE_REVERSE_MAP[value]
    }
    if (field === 'target_price' && typeof value === 'number') {
      csvValue = `€ ${value.toFixed(2).replace('.', ',')}`
    }

    updatedRow[colIdx] = csvValue ?? ''
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `inventory!A${rowNum}:S${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    })
    return true
  } catch {
    return false
  }
}

async function readRow(rowNumber: number): Promise<string[] | null> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()
  if (!sheets || !spreadsheetId) return null

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `inventory!A${rowNumber}:S${rowNumber}`,
    })
    return res.data.values?.[0] || null
  } catch {
    return null
  }
}

export function productToSheetFields(product: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {}

  if (product.title !== undefined) fields.product_name = product.title
  if (product.language !== undefined) fields.language = product.language
  if (product.condition !== undefined) fields.condition = product.condition
  if (product.storePrice !== undefined) fields.target_price = product.storePrice
  if (product.imageUrl !== undefined) fields.image_url = product.imageUrl
  if (product.productState !== undefined) fields.product_state = product.productState

  return fields
}
