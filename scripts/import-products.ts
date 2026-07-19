import { getPayload } from 'payload'
import config from '../src/payload.config'
import { importProductImages, buildImagesField } from '../src/lib/image-import'
import { parseCSV } from '../src/lib/parse-csv'

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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function run() {
  console.log('Fetching Google Sheet inventory...')
  const response = await fetch(GOOGLE_SHEET_CSV_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.statusText}`)
  }
  const csvText = await response.text()
  const rows = parseCSV(csvText)
  console.log(`Found ${rows.length} rows in inventory sheet`)

  const payload = await getPayload({ config })

  let createdCategories = 0
  let createdCollections = 0
  let createdProducts = 0
  let updatedProducts = 0
  let skippedRows = 0
  let imagesUploaded = 0

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
    const imageUrlRaw = row['image_url'] || row['image url'] || ''

    if (!itemId || !productName) {
      skippedRows++
      continue
    }

    if (productState.toUpperCase() === 'SOLD') {
      console.log(`Skipping ${itemId} - SOLD`)
      skippedRows++
      continue
    }

    // Find or create category
    let categoryId: string | number | null = null
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
        console.log(`Created category: ${category}`)
      }
    }

    // Find or create collection (from set field - take first if comma-separated)
    let collectionId: string | number | null = null
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
        console.log(`Created collection: ${setName}`)
      }
    }

    // Parse prices
    const parsePrice = (raw: string): number => {
      if (!raw) return 0
      const cleaned = raw.replace(/[€\s]/g, '').replace(',', '.')
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }

    const storePrice = parsePrice(storePriceRaw)
    const targetPrice = parsePrice(targetPriceRaw)
    const purchasePrice = parsePrice(purchasePriceRaw)

    // Determine displayed price: storePrice > targetPrice > purchasePrice
    const displayedPrice = storePrice || targetPrice || purchasePrice

    // Map condition
    const mappedCondition = CONDITION_MAP[condition.toUpperCase()] || 'near-mint'

    // Map language
    const mappedLanguage = LANGUAGE_MAP[language.toUpperCase()] || 'italian'

    // Map status
    const mappedStatus =
      productState.toUpperCase() === 'HOLD' ? 'hold' : 'listed'

    const slug = slugify(itemId)

    // Check if product exists by itemId
    const existingProduct = await payload.find({
      collection: 'products',
      where: { itemId: { equals: itemId } },
    })

    const productData: Record<string, any> = {
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

    // Handle images
    const currentImageCount = existingProduct.docs.length > 0
      ? (existingProduct.docs[0] as any).images?.length || 0
      : 0

    const imageResult = await importProductImages(
      payload,
      imageUrlRaw,
      productName,
      currentImageCount,
    )

    if (imageResult.uploaded > 0) {
      const existingImages = existingProduct.docs.length > 0
        ? ((existingProduct.docs[0] as any).images?.map((img: any) => typeof img === 'object' ? img.image : img) || [])
        : []
      const allImageIds = [...existingImages, ...imageResult.mediaIds]
      productData.images = buildImagesField(allImageIds)
      imagesUploaded += imageResult.uploaded
    }

    if (imageResult.errors.length > 0) {
      console.log(`Image errors for ${itemId}:`, imageResult.errors)
    }

    if (existingProduct.docs.length > 0) {
      await payload.update({
        collection: 'products',
        id: existingProduct.docs[0]!.id,
        data: productData,
      })
      updatedProducts++
      console.log(`Updated: ${itemId} - ${productName}`)
    } else {
      await payload.create({
        collection: 'products',
        data: productData,
      })
      createdProducts++
      console.log(`Created: ${itemId} - ${productName}`)
    }
  }

  console.log('\n--- Import Summary ---')
  console.log(`Categories created: ${createdCategories}`)
  console.log(`Collections created: ${createdCollections}`)
  console.log(`Products created: ${createdProducts}`)
  console.log(`Products updated: ${updatedProducts}`)
  console.log(`Images uploaded: ${imagesUploaded}`)
  console.log(`Rows skipped: ${skippedRows}`)
  console.log('----------------------')

  process.exit(0)
}

run().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
