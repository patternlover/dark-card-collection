import type { ProductDTO } from '@/app/dashboard/actions'

export const IN_STOCK = 'in_stock'
export const OUT_OF_STOCK = 'out_of_stock'
export const PREORDER = 'preorder'

export interface ListingSale {
  productId: number
  channel: string
  quantity: number
  value: number
  createdAt: string
}

export interface VariantSaleSummary {
  channel: string
  quantity: number
  value: number
  lastSaleAt?: string | null
}

export interface ListingVariant {
  id: string
  title: string
  grade?: string | null
  condition?: string | null
  language?: string | null
  quantity: number
  price?: number | null
  salePrice?: number | null
  cost?: number | null
  status: string
  availability: string
  isVisible: boolean
  featured: boolean
  soldQuantity: number
  saleSummaries: VariantSaleSummary[]
}

export interface ListingGroup {
  title: string
  variants: ListingVariant[]
  variantCount: number
  totalQuantity: number
  totalSold: number
  availability: string
  price: number | null
  cost: number | null
  visible: boolean
  hidden: boolean
  featured: boolean
}

export interface ListingFilters {
  search?: string
  availability?: string
  channel?: string
  visibility?: string
  featured?: string
}

export function deriveAvailability(quantity: number, availability?: string | null): string {
  if (quantity <= 0) return OUT_OF_STOCK
  if (availability === PREORDER) return PREORDER
  return IN_STOCK
}

function summarizeSales(sales: ListingSale[]): VariantSaleSummary[] {
  const byChannel = new Map<string, { quantity: number; value: number; lastSaleAt: string }>()
  for (const s of sales) {
    const cur = byChannel.get(s.channel) ?? { quantity: 0, value: 0, lastSaleAt: '' }
    cur.quantity += s.quantity
    cur.value += s.value
    if (s.createdAt && s.createdAt > cur.lastSaleAt) cur.lastSaleAt = s.createdAt
    byChannel.set(s.channel, cur)
  }
  return [...byChannel.entries()].map(([channel, c]) => ({
    channel,
    quantity: c.quantity,
    value: c.value,
    lastSaleAt: c.lastSaleAt || null,
  }))
}

function minPositive(values: (number | null | undefined)[]): number | null {
  const positive = values.filter((v): v is number => v != null && v > 0)
  return positive.length > 0 ? Math.min(...positive) : null
}

function weightedAvgCost(variants: ListingVariant[]): number | null {
  const withCost = variants.filter((v) => v.cost != null)
  if (withCost.length === 0) return null
  const totalQty = withCost.reduce((sum, v) => sum + Math.max(0, v.quantity), 0)
  if (totalQty > 0) {
    const totalCost = withCost.reduce((sum, v) => sum + Math.max(0, v.quantity) * (v.cost ?? 0), 0)
    return Math.round((totalCost / totalQty) * 100) / 100
  }
  const sum = withCost.reduce((acc, v) => acc + (v.cost ?? 0), 0)
  return Math.round((sum / withCost.length) * 100) / 100
}

export function buildListingGroups(products: ProductDTO[], sales: ListingSale[]): ListingGroup[] {
  const salesByProduct = new Map<number, ListingSale[]>()
  for (const s of sales) {
    const arr = salesByProduct.get(s.productId) ?? []
    arr.push(s)
    salesByProduct.set(s.productId, arr)
  }

  const byTitle = new Map<string, ProductDTO[]>()
  for (const p of products) {
    const key = p.title || 'Untitled'
    const arr = byTitle.get(key) ?? []
    arr.push(p)
    byTitle.set(key, arr)
  }

  const groups: ListingGroup[] = []
  for (const [title, prods] of byTitle) {
    const variants: ListingVariant[] = prods.map((p) => {
      const pSales = salesByProduct.get(Number(p.id)) ?? []
      return {
        id: p.id,
        title: p.title || '',
        grade: p.grade ?? null,
        condition: p.condition ?? null,
        language: p.language ?? null,
        quantity: Number(p.quantity) || 0,
        price: p.price ?? null,
        salePrice: p.salePrice ?? null,
        cost: p.costOfGoodsSold ?? null,
        status: p.status || 'listed',
        availability: deriveAvailability(Number(p.quantity) || 0, p.availability),
        isVisible: p.isVisible !== false,
        featured: Boolean(p.featured),
        soldQuantity: pSales.reduce((sum, s) => sum + s.quantity, 0),
        saleSummaries: summarizeSales(pSales),
      }
    })

    const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0)
    const totalSold = variants.reduce((sum, v) => sum + v.soldQuantity, 0)

    groups.push({
      title,
      variants,
      variantCount: variants.length,
      totalQuantity,
      totalSold,
      availability: totalQuantity > 0 ? IN_STOCK : OUT_OF_STOCK,
      price: minPositive(variants.map((v) => v.price)),
      cost: weightedAvgCost(variants),
      visible: variants.some((v) => v.isVisible),
      hidden: variants.every((v) => !v.isVisible),
      featured: variants.some((v) => v.featured),
    })
  }

  groups.sort((a, b) => a.title.localeCompare(b.title))
  return groups
}

export function filterListingGroups(groups: ListingGroup[], filters: ListingFilters = {}): ListingGroup[] {
  const q = (filters.search || '').trim().toLowerCase()
  let out = groups
  if (q) out = out.filter((g) => g.title.toLowerCase().includes(q))
  if (filters.availability === IN_STOCK) out = out.filter((g) => g.availability === IN_STOCK)
  if (filters.availability === OUT_OF_STOCK) out = out.filter((g) => g.availability === OUT_OF_STOCK)
  if (filters.channel) out = out.filter((g) => g.variants.some((v) => v.saleSummaries.some((s) => s.channel === filters.channel)))
  if (filters.visibility === 'visible') out = out.filter((g) => g.visible)
  if (filters.visibility === 'hidden') out = out.filter((g) => g.hidden)
  if (filters.featured === 'featured') out = out.filter((g) => g.featured)
  return out
}
