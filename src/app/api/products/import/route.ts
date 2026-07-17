import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1cVAh2HWPEGgYHKlJP4QbQ-zut2-2hoXpAiRw8iDuoiY/gviz/tq?tqx=out:csv&sheet=inventory'

const CONDITION_MAP: Record<string, string> = {
  SEALED: 'mint',
  NM: 'near-mint',
  EXC: 'lightly-played',
  GD: 'moderately-played',
  LP: 'heavily-played',
  PL: 'damaged',
  PSA: 'graded',
  BGS: 'graded',
  GRAAD: 'graded',
  OTHER: 'near-mint',
}

const LANGUAGE_MAP: Record<string, string> = {
  ITA: 'italian',
  ENG: 'english',
  CIN: 'chinese',
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })
    return row
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.PAYLOAD_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`)
    }
    const csvText = await response.text()
    const rows = parseCSV(csvText)

    const payload = await getPayload({ config })

    let createdCategories = 0
    let createdCollections = 0
    let createdProducts = 0
    let updatedProducts = 0
    let skippedRows = 0

    for (const row of rows) {
      const itemId = row['item_id'] || row['item id'] || ''
      const productName = row['product_name'] || row['product name'] || ''
      const category = row['category'] || ''
      const language = row['language'] || ''
      const set = row['set'] || ''
      const condition = row['condition'] || ''
      const productState = row['product_state'] || row['product state'] || ''
      const storePriceRaw = row['store_price'] || row['store price'] || ''
      const targetPriceRaw = row['target_price'] || row['target price'] || ''
      const purchasePriceRaw =
        row['unitary_gross_price'] || row['unitary gross price'] || ''

      if (!itemId || !productName) {
        skippedRows++
        continue
      }

      if (productState.toUpperCase() === 'SOLD') {
        skippedRows++
        continue
      }

      let categoryId: number | null = null
      if (category) {
        const existing = await payload.find({
          collection: 'categories',
          where: { name: { equals: category } },
        })

        if (existing.docs.length > 0) {
          categoryId = existing.docs[0]!.id
        } else {
          const newCat = await payload.create({
            collection: 'categories',
            data: {
              name: category,
              slug: slugify(category),
            },
          })
          categoryId = newCat.id
          createdCategories++
        }
      }

      let collectionId: number | null = null
      const setName = set.split(',')[0]?.trim() || ''
      if (setName) {
        const existing = await payload.find({
          collection: 'collections',
          where: { name: { equals: setName } },
        })

        if (existing.docs.length > 0) {
          collectionId = existing.docs[0]!.id
        } else {
          const newCol = await payload.create({
            collection: 'collections',
            data: {
              name: setName,
              slug: slugify(setName),
            },
          })
          collectionId = newCol.id
          createdCollections++
        }
      }

      const parsePrice = (raw: string): number => {
        if (!raw) return 0
        const cleaned = raw.replace(/[€\s]/g, '').replace(',', '.')
        const num = parseFloat(cleaned)
        return isNaN(num) ? 0 : num
      }

      const storePrice = parsePrice(storePriceRaw)
      const targetPrice = parsePrice(targetPriceRaw)
      const purchasePrice = parsePrice(purchasePriceRaw)

      const mappedCondition = CONDITION_MAP[condition.toUpperCase()] || 'near-mint'
      const mappedLanguage = LANGUAGE_MAP[language.toUpperCase()] || 'italian'
      const mappedStatus =
        productState.toUpperCase() === 'HOLD' ? 'hold' : 'listed'

      const slug = slugify(itemId)

      const existingProduct = await payload.find({
        collection: 'products',
        where: { itemId: { equals: itemId } },
      })

      const productData = {
        title: productName,
        slug,
        itemId,
        storePrice: storePrice || undefined,
        price: purchasePrice,
        compareAtPrice: targetPrice || undefined,
        status: mappedStatus,
        condition: mappedCondition,
        category: categoryId,
        collection: collectionId,
        language: mappedLanguage,
        quantity: 1,
      }

      if (existingProduct.docs.length > 0) {
        await payload.update({
          collection: 'products',
          id: existingProduct.docs[0]!.id,
          data: productData,
        })
        updatedProducts++
      } else {
        await payload.create({
          collection: 'products',
          data: productData,
        })
        createdProducts++
      }
    }

    return NextResponse.json({
      success: true,
      categories: createdCategories,
      collections: createdCollections,
      productsCreated: createdProducts,
      productsUpdated: updatedProducts,
      skipped: skippedRows,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed', details: String(error) },
      { status: 500 },
    )
  }
}
