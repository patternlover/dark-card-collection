'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { importProductImages, buildImagesField } from '@/lib/image-import'
import { parseCSV } from '@/lib/parse-csv'

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

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function syncInventory(password: string): Promise<{
  success: boolean
  authenticated?: boolean
  categories?: number
  collections?: number
  productsCreated?: number
  productsUpdated?: number
  imagesUploaded?: number
  skipped?: number
  imageErrors?: string[]
  debug?: string[]
  error?: string
  details?: string
}> {
  if (password !== process.env.SYNC_PASSWORD && password !== process.env.PAYLOAD_SECRET) {
    return { success: false, authenticated: false, error: 'Password non valida' }
  }

  const debug: string[] = []

  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL)
    if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`)
    const csvText = await response.text()
    const rows = parseCSV(csvText)

    debug.push(`Parsed ${rows.length} rows from CSV`)

    if (rows.length > 0) {
      const sample = rows[0]!
      debug.push(`Sample row keys: ${Object.keys(sample).join(', ')}`)
      debug.push(`Sample image_url: "${sample['image_url'] || '(empty)'}"`)
    }

    const payload = await getPayload({ config })

    let createdCategories = 0
    let createdCollections = 0
    let createdProducts = 0
    let updatedProducts = 0
    let skippedRows = 0
    let imagesUploaded = 0
    const imageErrors: string[] = []

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
      const purchasePriceRaw = row['unitary_gross_price'] || row['unitary gross price'] || ''
      const imageUrlRaw = row['image_url'] || row['image url'] || ''

      if (!itemId || !productName) { skippedRows++; continue }
      if (productState.toUpperCase() === 'SOLD') { skippedRows++; continue }

      let categoryId: string | number | null = null
      if (category) {
        const existing = await payload.find({ collection: 'categories', where: { name: { equals: category } } })
        if (existing.docs.length > 0) {
          categoryId = existing.docs[0]!.id
        } else {
          const newCat = await payload.create({ collection: 'categories', data: { name: category, slug: slugify(category) } })
          categoryId = newCat.id
          createdCategories++
        }
      }

      let collectionId: string | number | null = null
      const setName = set.split(',')[0]?.trim() || ''
      if (setName) {
        const existing = await payload.find({ collection: 'collections', where: { name: { equals: setName } } })
        if (existing.docs.length > 0) {
          collectionId = existing.docs[0]!.id
        } else {
          const newCol = await payload.create({ collection: 'collections', data: { name: setName, slug: slugify(setName) } })
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

      const existingProduct = await payload.find({ collection: 'products', where: { itemId: { equals: itemId } } })

      const productData: Record<string, any> = {
        title: productName,
        slug: slugify(itemId),
        itemId,
        storePrice: storePrice || undefined,
        price: purchasePrice,
        compareAtPrice: targetPrice || undefined,
        status: productState.toUpperCase() === 'HOLD' ? 'hold' : 'listed',
        condition: CONDITION_MAP[condition.toUpperCase()] || 'near-mint',
        category: categoryId,
        collection: collectionId,
        language: LANGUAGE_MAP[language.toUpperCase()] || 'italian',
        quantity: 1,
      }

      const currentImageCount = existingProduct.docs.length > 0
        ? ((existingProduct.docs[0] as any).images?.length ?? 0)
        : 0

      if (imageUrlRaw && debug.length < 10) {
        debug.push(`${itemId}: imageUrlRaw="${imageUrlRaw}", currentImages=${currentImageCount}`)
      }

      let imageResult = { mediaIds: [] as (string | number)[], uploaded: 0, errors: [] as string[] }

      if (currentImageCount === 0) {
        imageResult = await importProductImages(payload, imageUrlRaw, productName, currentImageCount)
      } else if (imageUrlRaw && debug.length < 15) {
        debug.push(`${itemId}: already has ${currentImageCount} image(s), skipping upload`)
      }

      if (imageResult.errors.length > 0) {
        for (const err of imageResult.errors) {
          imageErrors.push(`${itemId}: ${err}`)
        }
      }

      if (imageResult.uploaded > 0) {
        const existingImages = existingProduct.docs.length > 0
          ? (((existingProduct.docs[0] as any).images?.map((img: any) => typeof img === 'object' ? img.image : img) || []) as (number | null)[])
          : []
        const allImageIds = [...existingImages, ...imageResult.mediaIds].filter(
          (id): id is string | number => id !== null && id !== undefined,
        )
        productData.images = buildImagesField(allImageIds)
        imagesUploaded += imageResult.uploaded
      }

      if (existingProduct.docs.length > 0) {
        await payload.update({ collection: 'products', id: existingProduct.docs[0]!.id, data: productData })
        updatedProducts++
      } else {
        await payload.create({ collection: 'products', data: productData })
        createdProducts++
      }
    }

    return {
      success: true,
      authenticated: true,
      categories: createdCategories,
      collections: createdCollections,
      productsCreated: createdProducts,
      productsUpdated: updatedProducts,
      imagesUploaded,
      skipped: skippedRows,
      imageErrors,
      debug,
    }
  } catch (error) {
    return { success: false, authenticated: true, error: 'Import failed', details: String(error), debug }
  }
}
