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

export function flattenListingItems(groups: ListingGroup[]): ListingVariant[] {
  return groups.flatMap((g) => g.variants)
}

export function countFeaturedGroups(groups: ListingGroup[]): number {
  return groups.filter((g) => g.featured).length
}

export type SortDir = 'asc' | 'desc'

export interface ListingSort {
  by?: string
  dir?: SortDir
}

export function compareForSort(a: unknown, b: unknown): number {
  const aNull = a === null || a === undefined
  const bNull = b === null || b === undefined
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function groupField(g: ListingGroup, field: string): unknown {
  switch (field) {
    case 'quantity':
      return g.totalQuantity
    case 'sold':
      return g.totalSold
    case 'availability':
      return g.availability
    case 'price':
      return g.price
    case 'cost':
      return g.cost
    default:
      return g.title
  }
}

export function sortListingGroups(groups: ListingGroup[], sort: ListingSort = {}): ListingGroup[] {
  const by = sort.by
  if (!by) return groups
  const sign = sort.dir === 'desc' ? -1 : 1
  return [...groups].sort((a, b) => compareForSort(groupField(a, by), groupField(b, by)) * sign)
}

function itemField(v: ListingVariant, field: string): unknown {
  switch (field) {
    case 'quantity':
      return v.quantity
    case 'sold':
      return v.soldQuantity
    case 'availability':
      return v.availability
    case 'price':
      return v.price
    case 'cost':
      return v.cost
    default:
      return v.title
  }
}

export function sortListingItems(items: ListingVariant[], sort: ListingSort = {}): ListingVariant[] {
  const by = sort.by
  if (!by) return items
  const sign = sort.dir === 'desc' ? -1 : 1
  return [...items].sort((a, b) => compareForSort(itemField(a, by), itemField(b, by)) * sign)
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
