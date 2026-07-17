import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const GOOGLE_SHEET_SALES_URL =
  'https://docs.google.com/spreadsheets/d/1cVAh2HWPEGgYHKlJP4QbQ-zut2-2hoXpAiRw8iDuoiY/gviz/tq?tqx=out:csv&sheet=sales'

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

export async function GET() {
  try {
    const response = await fetch(GOOGLE_SHEET_SALES_URL)
    if (!response.ok) throw new Error(`Failed to fetch sales CSV: ${response.statusText}`)
    const csvText = await response.text()
    const salesRows = parseCSV(csvText)

    const payload = await getPayload({ config })

    const priceMap = new Map<string, { total: number; count: number }>()

    for (const row of salesRows) {
      const itemId = row['item_id'] || ''
      const salePriceRaw = row['sale_price'] || ''

      if (!itemId || !salePriceRaw) continue

      const cleaned = salePriceRaw.replace(/[€\s]/g, '').replace(',', '.')
      const salePrice = parseFloat(cleaned)
      if (isNaN(salePrice) || salePrice <= 0) continue

      const existing = priceMap.get(itemId) || { total: 0, count: 0 }
      existing.total += salePrice
      existing.count += 1
      priceMap.set(itemId, existing)
    }

    let updatedCount = 0

    for (const [itemId, { total, count }] of priceMap) {
      const averagePrice = Math.round((total / count) * 100) / 100

      const products = await payload.find({
        collection: 'products',
        where: { itemId: { equals: itemId } },
      })

      if (products.docs.length > 0) {
        await payload.update({
          collection: 'products',
          id: products.docs[0]!.id,
          data: {
            averageSalePrice: averagePrice,
            lastPriceUpdate: new Date().toISOString(),
          },
        })
        updatedCount++
      }
    }

    const summary: Record<string, { avg: number; sales: number }> = {}
    for (const [itemId, { total, count }] of priceMap) {
      summary[itemId] = {
        avg: Math.round((total / count) * 100) / 100,
        sales: count,
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      productsUpdated: updatedCount,
      priceSummary: summary,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Price update failed', details: String(error) }, { status: 500 })
  }
}
