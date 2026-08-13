'use server'

import { redirect } from 'next/navigation'
import { runReadOnlyQuery, isDashSqlEnabled, type QueryOutcome } from '@/lib/db-query'
import { getPayloadClient } from '@/lib/payload'
import { isAuthed, clearDashSession } from '@/lib/dash-auth'
import { slugify } from '@/lib/slug'
import { recordSale, type SalesChannel } from '@/lib/record-sale'
import { applyPurchaseDeletion, applyStockDelta, productIdFrom, purchaseStockDelta } from '@/lib/inventory'
import {
  buildListingGroups,
  countFeaturedGroups,
  filterListingGroups,
  flattenListingItems,
  sortListingGroups,
  sortListingItems,
  type ListingSale,
} from '@/lib/listings'
import { logAudit } from '@/lib/audit'
import type { Payload } from 'payload'

async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) {
    throw new Error('Unauthorized')
  }
}

export async function logout(): Promise<void> {
  logAudit('dashboard.logout', {})
  await clearDashSession()
  redirect('/')
}

export interface CategoryOption {
  id: string
  name: string
}

export interface CollectionOption {
  id: string
  name: string
}

export interface ProductDTO {
  id: string
  title: string
  slug: string
  itemGroupId?: string | null
  description?: string | null
  price?: number | null
  salePrice?: number | null
  costOfGoodsSold?: number | null
  status: string
  availability?: string | null
  isPreorder?: boolean | null
  grade?: string | null
  condition?: string | null
  productType?: string | null
  googleProductCategory?: string | null
  category?: { id: string; name: string } | null
  collection?: { id: string; name: string } | null
  language?: string | null
  cardNumber?: string | null
  rarity?: string | null
  quantity: number
  imageLink?: string | null
  images?: Array<{ image?: { id: string; url?: string } | string | null }> | null
  averageSalePrice?: number | null
  lastPriceUpdate?: string | null
  featured?: boolean | null
  isVisible: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface OrderItemDTO {
  productId: string | null
  title: string
  quantity: number
  price: number
  unitCostSnapshot?: number | null
}

export interface OrderDTO {
  id: string
  transactionId?: string | null
  email?: string | null
  status: string
  value?: number | null
  salesChannel?: string | null
  margin?: number | null
  createdAt: string
  itemCount: number
  stripeSessionId?: string | null
  items: OrderItemDTO[]
}

export interface OverviewData {
  products: {
    total: number
    listed: number
    hold: number
    sold: number
    visible: number
    lowStock: number
  }
  inventoryValue: number
  orders: {
    total: number
    pending: number
    paid: number
    shipped: number
    delivered: number
    cancelled: number
  }
  revenue: number
  recentOrders: OrderDTO[]
}

const PAID_STATUSES = ['paid', 'shipped', 'delivered']

function relName(rel: any): string {
  return rel?.name ?? ''
}

function toProductDTO(doc: any): ProductDTO {
  return {
    id: doc.id,
    title: doc.title || '',
    slug: doc.slug || '',
    itemGroupId: doc.item_group_id ?? null,
    description: doc.description ?? null,
    price: doc.price ?? null,
    salePrice: doc.sale_price ?? null,
    costOfGoodsSold: doc.cost_of_goods_sold ?? null,
    status: doc.status || 'listed',
    availability: doc.availability ?? null,
    isPreorder: doc.is_preorder ?? null,
    grade: doc.grade ?? null,
    condition: doc.condition ?? null,
    productType: doc.product_type ?? null,
    googleProductCategory: doc.google_product_category ?? null,
    category: doc.category ? { id: String(doc.category.id ?? doc.category), name: relName(doc.category) } : null,
    collection: doc.collection
      ? { id: String(doc.collection.id ?? doc.collection), name: relName(doc.collection) }
      : null,
    language: doc.language ?? null,
    cardNumber: doc.card_number ?? null,
    rarity: doc.rarity ?? null,
    quantity: doc.quantity ?? 0,
    imageLink: doc.image_link ?? null,
    images: doc.images ?? null,
    averageSalePrice: doc.average_sale_price ?? null,
    lastPriceUpdate: doc.last_price_update ?? null,
    featured: doc.featured ?? null,
    isVisible: doc.is_visible ?? true,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  }
}

function toOrderDTO(doc: any): OrderDTO {
  const items = Array.isArray(doc.items) ? doc.items : []
  const orderItems: OrderItemDTO[] = items.map((item: any) => ({
    productId: item.product
      ? typeof item.product === 'object'
        ? String(item.product.id)
        : String(item.product)
      : null,
    title:
      typeof item.product === 'object'
        ? item.product.title || 'Prodotto'
        : 'Prodotto',
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    unitCostSnapshot: item.unit_cost_snapshot != null ? Number(item.unit_cost_snapshot) : null,
  }))
  const totalCost = orderItems.reduce(
    (acc, item) => acc + (item.unitCostSnapshot ?? 0) * item.quantity,
    0,
  )
  const hasSnapshot = orderItems.some((item) => item.unitCostSnapshot != null)
  return {
    id: doc.id,
    transactionId: doc.transaction_id ?? null,
    email: doc.email ?? null,
    status: doc.status || 'pending',
    value: doc.value ?? null,
    salesChannel: doc.sales_channel ?? null,
    margin: hasSnapshot ? (Number(doc.value) || 0) - totalCost : null,
    createdAt: doc.createdAt ?? new Date().toISOString(),
    itemCount: orderItems.reduce((acc: number, item) => acc + item.quantity, 0),
    stripeSessionId: doc.stripe_session_id ?? null,
    items: orderItems,
  }
}

const OVERVIEW_PRODUCTS_SQL = `
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE status = 'listed')::int AS listed,
    COUNT(*) FILTER (WHERE status = 'hold')::int AS hold,
    COUNT(*) FILTER (WHERE status = 'sold')::int AS sold,
    COUNT(*) FILTER (WHERE is_visible IS DISTINCT FROM false)::int AS visible,
    COUNT(*) FILTER (WHERE is_visible IS DISTINCT FROM false AND COALESCE(quantity, 0) <= 1)::int AS low_stock,
    COALESCE(SUM(CASE WHEN status = 'listed' AND is_visible IS DISTINCT FROM false
      THEN COALESCE(price, 0) * COALESCE(quantity, 0) END), 0)::float8 AS inventory_value
  FROM products
`

const OVERVIEW_ORDERS_SQL = `
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
    COUNT(*) FILTER (WHERE status = 'paid')::int AS paid,
    COUNT(*) FILTER (WHERE status = 'shipped')::int AS shipped,
    COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
    COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
    COALESCE(SUM(CASE WHEN status IN ('paid','shipped','delivered') THEN COALESCE(value, 0) END), 0)::float8 AS revenue
  FROM orders
`

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v || 0)
}

function computeOverviewFromDocs(products: any[], orders: any[]): OverviewData {
  const listed = products.filter((p) => p.status === 'listed')
  const hold = products.filter((p) => p.status === 'hold')
  const sold = products.filter((p) => p.status === 'sold')
  const visible = products.filter((p) => p.is_visible !== false)
  const lowStock = products.filter((p) => p.is_visible !== false && (Number(p.quantity) || 0) <= 1)
  const inventoryValue = listed
    .filter((p) => p.is_visible !== false)
    .reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 0), 0)

  const ordersByStatus: OverviewData['orders'] = {
    total: orders.length,
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }
  let revenue = 0
  for (const o of orders) {
    const status = o.status || 'pending'
    if (status in ordersByStatus) ordersByStatus[status as keyof typeof ordersByStatus] += 1
    if (PAID_STATUSES.includes(status)) revenue += Number(o.value) || 0
  }

  return {
    products: {
      total: products.length,
      listed: listed.length,
      hold: hold.length,
      sold: sold.length,
      visible: visible.length,
      lowStock: lowStock.length,
    },
    inventoryValue,
    orders: ordersByStatus,
    revenue,
    recentOrders: orders.slice(0, 8).map(toOrderDTO),
  }
}

export async function getOverview(): Promise<OverviewData> {
  await requireAuth()

  const [pRes, oRes, ordersRes] = await Promise.all([
    runReadOnlyQuery(OVERVIEW_PRODUCTS_SQL),
    runReadOnlyQuery(OVERVIEW_ORDERS_SQL),
    getPayloadClient().then((payload) =>
      payload.find({ overrideAccess: true,  collection: 'orders', limit: 8, sort: '-createdAt', depth: 1, draft: false }),
    ),
  ])

  if (pRes.error || oRes.error) {
    const payload = await getPayloadClient()
    const [productsRes, allOrdersRes] = await Promise.all([
      payload.find({ overrideAccess: true,  collection: 'products', limit: 1000, draft: false }),
      payload.find({ overrideAccess: true,  collection: 'orders', limit: 1000, sort: '-createdAt', depth: 1, draft: false }),
    ])
    return computeOverviewFromDocs(productsRes.docs, allOrdersRes.docs)
  }

  const p = pRes.rows[0] || {}
  const o = oRes.rows[0] || {}

  return {
    products: {
      total: num(p.total),
      listed: num(p.listed),
      hold: num(p.hold),
      sold: num(p.sold),
      visible: num(p.visible),
      lowStock: num(p.low_stock),
    },
    inventoryValue: num(p.inventory_value),
    orders: {
      total: num(o.total),
      pending: num(o.pending),
      paid: num(o.paid),
      shipped: num(o.shipped),
      delivered: num(o.delivered),
      cancelled: num(o.cancelled),
    },
    revenue: num(o.revenue),
    recentOrders: ordersRes.docs.map(toOrderDTO),
  }
}

export interface ProductFilters {
  search?: string
  status?: string
  category?: string
  collection?: string
  withImage?: string
  limit?: number
  page?: number
}

export interface ProductSearchResult {
  docs: ProductDTO[]
  total: number
  totalPages: number
}

export async function searchProducts(filters: ProductFilters = {}): Promise<ProductSearchResult> {
  await requireAuth()
  const payload = await getPayloadClient()

  const where: any[] = []
  const q = (filters.search || '').trim()
  if (q) {
    where.push({
      or: [{ title: { contains: q } }, { item_group_id: { contains: q } }, { description: { contains: q } }],
    })
  }
  if (filters.status) where.push({ status: { equals: filters.status } })
  if (filters.category) where.push({ category: { equals: Number(filters.category) } })
  if (filters.collection) where.push({ collection: { equals: Number(filters.collection) } })
  if (filters.withImage === 'yes') where.push({ image_link: { exists: true } })
  if (filters.withImage === 'no') where.push({ image_link: { exists: false } })

  const res = await payload.find({ overrideAccess: true, 
    collection: 'products',
    where: where.length > 0 ? ({ and: where } as any) : undefined,
    limit: filters.limit || 50,
    page: filters.page || 1,
    sort: '-createdAt',
    depth: 1,
    draft: false,
  })
  return {
    docs: res.docs.map(toProductDTO),
    total: res.totalDocs,
    totalPages: res.totalPages,
  }
}

export async function getCategories(): Promise<CategoryOption[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ overrideAccess: true,  collection: 'categories', limit: 500, sort: 'name' })
  return res.docs.map((d: any) => ({ id: String(d.id), name: d.name }))
}

export async function getCollections(): Promise<CollectionOption[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ overrideAccess: true,  collection: 'collections', limit: 500, sort: 'name' })
  return res.docs.map((d: any) => ({ id: String(d.id), name: d.name }))
}

export interface UpdateProductPatch {
  title?: string
  slug?: string
  itemGroupId?: string | null
  description?: string | null
  price?: number | null
  salePrice?: number | null
  costOfGoodsSold?: number | null
  status?: string
  availability?: string
  isPreorder?: boolean
  grade?: string
  condition?: string
  productType?: string | null
  googleProductCategory?: string | null
  category?: string | number | null
  collection?: string | number | null
  language?: string
  cardNumber?: string | null
  rarity?: string | null
  quantity?: number
  imageLink?: string | null
  featured?: boolean
  isVisible?: boolean
}

export type CreateProductData = UpdateProductPatch

const PATCH_FIELD_MAP: Record<string, string> = {
  itemGroupId: 'item_group_id',
  salePrice: 'sale_price',
  costOfGoodsSold: 'cost_of_goods_sold',
  isPreorder: 'is_preorder',
  cardNumber: 'card_number',
  imageLink: 'image_link',
  isVisible: 'is_visible',
  productType: 'product_type',
  googleProductCategory: 'google_product_category',
}

export async function updateProduct(id: string, patch: UpdateProductPatch): Promise<ProductDTO> {
  await requireAuth()
  logAudit('product.update', { id, keys: Object.keys(patch) })
  const payload = await getPayloadClient()
  const data: Record<string, any> = {}
  const keys: (keyof UpdateProductPatch)[] = [
    'title',
    'slug',
    'itemGroupId',
    'description',
    'price',
    'salePrice',
    'costOfGoodsSold',
    'status',
    'availability',
    'isPreorder',
    'grade',
    'condition',
    'productType',
    'googleProductCategory',
    'category',
    'collection',
    'language',
    'cardNumber',
    'rarity',
    'quantity',
    'imageLink',
    'featured',
    'isVisible',
  ]
  for (const key of keys) {
    if (key in patch) data[PATCH_FIELD_MAP[key] ?? key] = patch[key] ?? undefined
  }

  const res = await payload.update({ overrideAccess: true, 
    collection: 'products',
    id,
    data: data as any,
    depth: 1,
    draft: false,
  })
  return toProductDTO(res)
}

export async function getProductById(id: string): Promise<ProductDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.findByID({ overrideAccess: true,  collection: 'products', id, depth: 1, draft: false })
  return toProductDTO(res)
}

export async function createProduct(data: CreateProductData): Promise<ProductDTO> {
  await requireAuth()
  const payload = await getPayloadClient()

  const title = (data.title || '').trim()
  if (!title) throw new Error('Il titolo è obbligatorio')

  let slug = (data.slug || '').trim() || slugify(title)
  let candidate = slug
  let i = 2
  while (true) {
    const existing = await payload.find({ overrideAccess: true, 
      collection: 'products',
      where: { slug: { equals: candidate } },
      limit: 1,
    })
    if (existing.docs.length === 0) break
    candidate = `${slug}-${i++}`
  }

  const res = await payload.create({ overrideAccess: true, 
    collection: 'products',
    data: {
      title,
      slug: candidate,
      item_group_id: data.itemGroupId || undefined,
      description: data.description || undefined,
      price: data.price ?? undefined,
      sale_price: data.salePrice ?? undefined,
      cost_of_goods_sold: data.costOfGoodsSold ?? undefined,
      status: data.status || 'listed',
      availability: data.availability || 'in_stock',
      is_preorder: data.isPreorder ?? false,
      grade: data.grade || 'near-mint',
      condition: data.condition || 'used',
      product_type: data.productType || undefined,
      google_product_category: data.googleProductCategory || undefined,
      category: data.category || undefined,
      collection: data.collection || undefined,
      language: data.language || 'italian',
      card_number: data.cardNumber || undefined,
      rarity: data.rarity || undefined,
      quantity: data.quantity ?? 1,
      image_link: data.imageLink || undefined,
      featured: data.featured ?? false,
      is_visible: data.isVisible ?? true,
    } as any,
    depth: 1,
    draft: false,
  })
  return toProductDTO(res)
}

export async function getOrders(): Promise<OrderDTO[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ overrideAccess: true, 
    collection: 'orders',
    limit: 200,
    sort: '-createdAt',
    depth: 1,
    draft: false,
  })
  return res.docs.map(toOrderDTO)
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderDTO> {
  await requireAuth()
  logAudit('order.status', { id, status })
  const payload = await getPayloadClient()
  const res = await payload.update({ overrideAccess: true, 
    collection: 'orders',
    id,
    data: { status } as any,
    depth: 1,
    draft: false,
  })
  return toOrderDTO(res)
}

export async function runQuery(sql: string): Promise<QueryOutcome> {
  await requireAuth()
  if (!isDashSqlEnabled()) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      timeMs: 0,
      truncated: false,
      error: 'Sezione SQL disabilitata in questo ambiente',
    }
  }
  return runReadOnlyQuery(sql)
}

export interface DbTableInfo {
  table: string
  rowCount: number
}

const DB_OVERVIEW_SQL = `
  SELECT t.table_name,
         COALESCE(s.n_live_tup, 0)::int AS row_count
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name
`

export async function getDbOverview(): Promise<DbTableInfo[]> {
  await requireAuth()
  if (!isDashSqlEnabled()) return []
  const res = await runReadOnlyQuery(DB_OVERVIEW_SQL)
  if (res.error) return []
  return res.rows
    .map((r) => ({ table: String(r.table_name || ''), rowCount: num(r.row_count) }))
    .filter((t) => t.table.length > 0)
}

export interface DeleteProductResult {
  ok: boolean
  message?: string
}

export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  await requireAuth()
  const payload = await getPayloadClient()
  const pid = Number(id)

  try {
    const orderRef = await payload.find({
      overrideAccess: true,
      collection: 'orders',
      where: { 'items.product': { equals: pid } },
      limit: 1,
    })
    if (orderRef.totalDocs > 0) {
      return {
        ok: false,
        message: 'Il prodotto risulta in ordini: elimina prima gli ordini collegati o nascondilo dal listino',
      }
    }

    const purchases: any[] = []
    let page = 1
    const pageSize = 100
    for (;;) {
      const res = await payload.find({
        overrideAccess: true,
        collection: 'purchases',
        where: { 'lines.product': { equals: pid } },
        page,
        limit: pageSize,
        depth: 1,
      })
      purchases.push(...res.docs)
      if (page >= res.totalPages) break
      page += 1
    }

    const hasResidualStock = purchases.some((p) =>
      (p.lines ?? []).some(
        (l: any) =>
          productIdFrom(l.product) === pid &&
          Number(l.remaining_quantity ?? l.quantity ?? 0) > 0,
      ),
    )
    if (hasResidualStock) {
      return {
        ok: false,
        message: 'Il prodotto ha stock residuo nei lotti: modifica o elimina prima i lotti collegati (sezione Lotti)',
      }
    }

    for (const purchase of purchases) {
      const keptLines = (purchase.lines ?? [])
        .filter((l: any) => productIdFrom(l.product) !== pid)
        .map((l: any) => ({
          id: l.id,
          product: productIdFrom(l.product),
          quantity: Number(l.quantity ?? 0),
          unit_cost: Number(l.unit_cost ?? 0),
          effective_unit_cost: Number(l.effective_unit_cost ?? 0),
          remaining_quantity: Number(l.remaining_quantity ?? l.quantity ?? 0),
        }))
      await payload.update({
        overrideAccess: true,
        collection: 'purchases',
        id: purchase.id,
        data: { lines: keptLines } as any,
      })
    }

    await payload.delete({ overrideAccess: true, collection: 'products', id })
    return { ok: true }
  } catch {
    return { ok: false, message: 'Errore durante l\'eliminazione del prodotto' }
  }
}

export interface ListingSearchFilters {
  search?: string
  availability?: string
  visibility?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface ListingSearchResult {
  groups: ReturnType<typeof buildListingGroups>
  featuredCount: number
  total: number
  totalPages: number
  error?: string
}

async function fetchListingDataset(
  payload: Payload,
  search?: string,
): Promise<{ products: ProductDTO[]; sales: ListingSale[] }> {
  const products: ProductDTO[] = []
  let page = 1
  const where = search?.trim() ? ({ title: { contains: search.trim() } } as any) : undefined
  for (;;) {
    const res = await payload.find({
      overrideAccess: true,
      collection: 'products',
      where,
      limit: 1000,
      page,
      sort: 'title',
      depth: 1,
      draft: false,
    })
    products.push(...res.docs.map(toProductDTO))
    if (page >= res.totalPages) break
    page += 1
  }

  const sales: ListingSale[] = []
  let oPage = 1
  for (;;) {
    const res = await payload.find({
      overrideAccess: true,
      collection: 'orders',
      limit: 500,
      page: oPage,
      sort: '-createdAt',
      depth: 1,
      draft: false,
    })
    for (const doc of res.docs) {
      if (!PAID_STATUSES.includes(doc.status || 'pending')) continue
      const channel = doc.sales_channel || 'website'
      const createdAt = doc.createdAt ?? ''
      for (const item of doc.items ?? []) {
        const pid = typeof item.product === 'object' ? Number(item.product?.id) : Number(item.product)
        if (!pid) continue
        sales.push({
          productId: pid,
          channel,
          quantity: Number(item.quantity) || 0,
          value: (Number(item.price) || 0) * (Number(item.quantity) || 0),
          createdAt,
        })
      }
    }
    if (oPage >= res.totalPages) break
    oPage += 1
  }

  return { products, sales }
}

export async function searchListings(filters: ListingSearchFilters = {}): Promise<ListingSearchResult> {
  await requireAuth()
  const payload = await getPayloadClient()

  const empty = { groups: [], featuredCount: 0, total: 0, totalPages: 1 }

  try {
    const { products, sales } = await fetchListingDataset(payload, filters.search)
    const groups = buildListingGroups(products, sales)
    const featuredCount = countFeaturedGroups(groups)
    const filtered = sortListingGroups(filterListingGroups(groups, filters), {
      by: filters.sortBy || 'title',
      dir: filters.sortDir || 'asc',
    })
    const limit = filters.limit || 25
    const pageNum = filters.page || 1
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
    const slice = filtered.slice((pageNum - 1) * limit, pageNum * limit)

    return {
      groups: slice,
      featuredCount,
      total: filtered.length,
      totalPages,
    }
  } catch {
    return { ...empty, error: 'Errore nel caricamento del listino' }
  }
}

export interface ListingProductFilters {
  search?: string
  status?: string
  availability?: string
  visibility?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface ListingProductSearchResult {
  items: ReturnType<typeof flattenListingItems>
  total: number
  totalPages: number
  error?: string
}

export async function searchListingProducts(filters: ListingProductFilters = {}): Promise<ListingProductSearchResult> {
  await requireAuth()
  const payload = await getPayloadClient()

  const empty = { items: [], total: 0, totalPages: 1 }

  try {
    const { products, sales } = await fetchListingDataset(payload, filters.search)
    const groups = buildListingGroups(products, sales)
    let items = flattenListingItems(groups)
    if (filters.status) items = items.filter((v) => v.status === filters.status)
    if (filters.availability === 'in_stock') items = items.filter((v) => v.availability === 'in_stock')
    if (filters.availability === 'out_of_stock') items = items.filter((v) => v.availability === 'out_of_stock')
    if (filters.visibility === 'visible') items = items.filter((v) => v.isVisible)
    if (filters.visibility === 'hidden') items = items.filter((v) => !v.isVisible)
    items = sortListingItems(items, { by: filters.sortBy || 'title', dir: filters.sortDir || 'asc' })

    const limit = filters.limit || 25
    const pageNum = filters.page || 1
    const totalPages = Math.max(1, Math.ceil(items.length / limit))
    const slice = items.slice((pageNum - 1) * limit, pageNum * limit)

    return {
      items: slice,
      total: items.length,
      totalPages,
    }
  } catch {
    return { ...empty, error: 'Errore nel caricamento dei prodotti' }
  }
}

export interface UpdateGroupResult {
  ok: boolean
  message?: string
  title?: string
  isVisible?: boolean
  featured?: boolean
}

export async function updateGroup(
  title: string,
  patch: { isVisible?: boolean; featured?: boolean },
): Promise<UpdateGroupResult> {
  await requireAuth()
  const payload = await getPayloadClient()

  try {
    const res = await payload.find({
      overrideAccess: true,
      collection: 'products',
      where: { title: { equals: title } },
      limit: 200,
      depth: 1,
      draft: false,
    })
    if (res.docs.length === 0) {
      return { ok: false, message: 'Gruppo non trovato: nessun prodotto con questo nome' }
    }
    for (const doc of res.docs) {
      const data: Record<string, any> = {}
      if (patch.isVisible !== undefined) data.is_visible = patch.isVisible
      if (patch.featured !== undefined) data.featured = patch.featured
      await payload.update({
        overrideAccess: true,
        collection: 'products',
        id: doc.id,
        data,
        draft: false,
      })
    }
    return { ok: true, title, isVisible: patch.isVisible, featured: patch.featured }
  } catch {
    return { ok: false, message: 'Errore durante l\'aggiornamento del gruppo' }
  }
}

export interface ToggleVariantResult {
  ok: boolean
  message?: string
  id?: string
  isVisible?: boolean
}

export async function toggleVariantVisibility(id: string, isVisible: boolean): Promise<ToggleVariantResult> {
  await requireAuth()
  const payload = await getPayloadClient()

  try {
    const existing = await payload.findByID({ overrideAccess: true,  collection: 'products', id, draft: false })
    if (!existing) {
      return { ok: false, message: 'Prodotto non trovato' }
    }
    await payload.update({
      overrideAccess: true,
      collection: 'products',
      id,
      data: { is_visible: isVisible } as any,
      draft: false,
    })
    return { ok: true, id, isVisible }
  } catch {
    return { ok: false, message: 'Errore durante l\'aggiornamento della variante' }
  }
}

export interface ManualSaleResult {
  ok: boolean
  message?: string
}

export async function recordManualWebsiteSale(data: {
  productId: string
  quantity: number
  price: number
  email?: string
}): Promise<ManualSaleResult> {
  await requireAuth()
  const payload = await getPayloadClient()

  try {
    const qty = Math.max(1, Number(data.quantity) || 0)
    const price = Number(data.price)
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, message: 'Inserisci un prezzo di vendita valido' }
    }
    const email = (data.email || '').trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: 'Inserisci un\'email valida' }
    }
    const prodRes = await payload.findByID({ overrideAccess: true,  collection: 'products', id: data.productId, draft: false })
    if (!prodRes) return { ok: false, message: 'Prodotto non trovato in inventario' }
    const stock = Number((prodRes as { quantity?: number }).quantity ?? 0)
    if (qty > stock) {
      return { ok: false, message: 'Quantità superiore allo stock disponibile' }
    }

    const transactionId = `WEB-MANUAL-${Date.now()}`
    logAudit('sale.manual', { productId: data.productId, quantity: qty, channel: 'website', value: price * qty, hasEmail: Boolean(email) })
    await recordSale(payload, {
      transactionId,
      channel: 'website',
      email: email || 'manual@darkcardcollection.com',
      items: [{ productId: Number(data.productId), quantity: qty, price }],
      value: price * qty,
      currency: 'EUR',
    })
    return { ok: true }
  } catch {
    return { ok: false, message: 'Errore durante la registrazione della vendita' }
  }
}

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  description?: string | null
}

export async function getCategoriesFull(): Promise<CategoryDTO[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ overrideAccess: true,  collection: 'categories', limit: 500, sort: 'name', draft: false })
  return res.docs.map((d: any) => ({
    id: String(d.id),
    name: d.name || '',
    slug: d.slug || '',
    description: d.description ?? null,
  }))
}

export async function createCategory(data: { name: string; slug?: string; description?: string }): Promise<CategoryDTO> {
  await requireAuth()
  const payload = await getPayloadClient()

  const name = (data.name || '').trim()
  if (!name) throw new Error('Il nome è obbligatorio')

  let slug = (data.slug || '').trim() || slugify(name)
  let candidate = slug
  let i = 2
  while (true) {
    const existing = await payload.find({ overrideAccess: true,  collection: 'categories', where: { slug: { equals: candidate } }, limit: 1 })
    if (existing.docs.length === 0) break
    candidate = `${slug}-${i++}`
  }

  const res = await payload.create({ overrideAccess: true, 
    collection: 'categories',
    data: { name, slug: candidate, description: data.description || undefined } as any,
  })
  return {
    id: String(res.id),
    name: res.name as string,
    slug: res.slug as string,
    description: (res.description ?? null) as string | null,
  }
}

export async function updateCategory(
  id: string,
  data: { name?: string; slug?: string; description?: string | null },
): Promise<CategoryDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const patch: Record<string, any> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.slug !== undefined) patch.slug = data.slug
  if (data.description !== undefined) patch.description = data.description ?? undefined
  const res = await payload.update({ overrideAccess: true,  collection: 'categories', id, data: patch as any })
  return {
    id: String(res.id),
    name: res.name as string,
    slug: res.slug as string,
    description: (res.description ?? null) as string | null,
  }
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ overrideAccess: true,  collection: 'categories', id })
}

export interface CollectionDTO {
  id: string
  name: string
  slug: string
  description?: string | null
  releaseDate?: string | null
}

export async function getCollectionsFull(): Promise<CollectionDTO[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ overrideAccess: true,  collection: 'collections', limit: 500, sort: 'name', draft: false })
  return res.docs.map((d: any) => ({
    id: String(d.id),
    name: d.name || '',
    slug: d.slug || '',
    description: d.description ?? null,
    releaseDate: d.releaseDate ?? null,
  }))
}

export async function createCollection(data: {
  name: string
  slug?: string
  description?: string
  releaseDate?: string | null
}): Promise<CollectionDTO> {
  await requireAuth()
  const payload = await getPayloadClient()

  const name = (data.name || '').trim()
  if (!name) throw new Error('Il nome è obbligatorio')

  let slug = (data.slug || '').trim() || slugify(name)
  let candidate = slug
  let i = 2
  while (true) {
    const existing = await payload.find({ overrideAccess: true,  collection: 'collections', where: { slug: { equals: candidate } }, limit: 1 })
    if (existing.docs.length === 0) break
    candidate = `${slug}-${i++}`
  }

  const res = await payload.create({ overrideAccess: true, 
    collection: 'collections',
    data: {
      name,
      slug: candidate,
      description: data.description || undefined,
      releaseDate: data.releaseDate || undefined,
    } as any,
  })
  return {
    id: String(res.id),
    name: res.name as string,
    slug: res.slug as string,
    description: (res.description ?? null) as string | null,
    releaseDate: (res.releaseDate ?? null) as string | null,
  }
}

export async function updateCollection(
  id: string,
  data: { name?: string; slug?: string; description?: string | null; releaseDate?: string | null },
): Promise<CollectionDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const patch: Record<string, any> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.slug !== undefined) patch.slug = data.slug
  if (data.description !== undefined) patch.description = data.description ?? undefined
  if (data.releaseDate !== undefined) patch.releaseDate = data.releaseDate || undefined
  const res = await payload.update({ overrideAccess: true,  collection: 'collections', id, data: patch as any })
  return {
    id: String(res.id),
    name: res.name as string,
    slug: res.slug as string,
    description: (res.description ?? null) as string | null,
    releaseDate: (res.releaseDate ?? null) as string | null,
  }
}

export async function deleteCollection(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ overrideAccess: true,  collection: 'collections', id })
}

export interface MessageDTO {
  id: string
  name: string
  email: string
  subject?: string | null
  message?: string | null
  read: boolean
  replied: boolean
  createdAt: string
}

export interface MessagesPage {
  messages: MessageDTO[]
  total: number
}

export async function getMessagesPage(page = 1, pageSize = 20): Promise<MessagesPage> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ overrideAccess: true, 
    collection: 'messages',
    limit: pageSize,
    page,
    sort: '-createdAt',
    draft: false,
  })
  return {
    messages: res.docs.map((d: any) => ({
      id: String(d.id),
      name: d.name || '',
      email: d.email || '',
      subject: d.subject ?? null,
      message: null,
      read: Boolean(d.read),
      replied: Boolean(d.replied),
      createdAt: d.createdAt ?? new Date().toISOString(),
    })),
    total: res.totalDocs,
  }
}

export async function getMessageBody(id: string): Promise<string | null> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.findByID({ overrideAccess: true,  collection: 'messages', id, draft: false })
  return (res as any).message ?? null
}

export async function toggleMessageRead(id: string, read: boolean): Promise<{ id: string; read: boolean }> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.update({ overrideAccess: true,  collection: 'messages', id, data: { read } as any })
  return { id: String(id), read }
}

export async function toggleMessageReplied(id: string, replied: boolean): Promise<{ id: string; replied: boolean }> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.update({ overrideAccess: true,  collection: 'messages', id, data: { replied } as any })
  return { id: String(id), replied }
}

export async function deleteMessage(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ overrideAccess: true,  collection: 'messages', id })
}

export interface SiteSettingsDTO {
  siteName?: string | null
  description?: string | null
}

export async function getSiteSettings(): Promise<SiteSettingsDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const g = await payload.findGlobal({ overrideAccess: true,  slug: 'site-settings', draft: false })
  return {
    siteName: (g as any).siteName ?? null,
    description: (g as any).description ?? null,
  }
}

export async function updateSiteSettings(data: SiteSettingsDTO): Promise<SiteSettingsDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const patch: Record<string, any> = {}
  if (data.siteName !== undefined) patch.siteName = data.siteName
  if (data.description !== undefined) patch.description = data.description
  const g = await payload.updateGlobal({ overrideAccess: true,  slug: 'site-settings', data: patch as any })
  return {
    siteName: (g as any).siteName ?? null,
    description: (g as any).description ?? null,
  }
}

export interface HeaderNavItem {
  id?: string
  label: string
  url: string
}

export interface HeaderDTO {
  logoId?: string | null
  navItems: HeaderNavItem[]
}

export async function getHeader(): Promise<HeaderDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const g = await payload.findGlobal({ overrideAccess: true,  slug: 'header', depth: 1, draft: false })
  const logo = (g as any).logo
  const navItems = Array.isArray((g as any).navItems)
    ? (g as any).navItems.map((n: any) => ({ id: n.id, label: n.label || '', url: n.url || '' }))
    : []
  return { logoId: logo ? String(logo.id ?? logo) : null, navItems }
}

export async function updateHeader(data: HeaderDTO): Promise<HeaderDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const navItems = (data.navItems || [])
    .map((n) => ({ label: (n.label || '').trim(), url: (n.url || '').trim() }))
    .filter((n) => n.label || n.url)
  const patch: Record<string, any> = { navItems }
  if (data.logoId !== undefined) patch.logo = data.logoId ? Number(data.logoId) : null
  const g = await payload.updateGlobal({ overrideAccess: true,  slug: 'header', data: patch as any })
  const logo = (g as any).logo
  return {
    logoId: logo ? String(logo.id ?? logo) : null,
    navItems: Array.isArray((g as any).navItems)
      ? (g as any).navItems.map((n: any) => ({ id: n.id, label: n.label || '', url: n.url || '' }))
      : [],
  }
}

export interface PurchaseLineDTO {
  productId: string
  title: string
  quantity: number
  unitCost: number
  effectiveUnitCost: number
  remainingQuantity: number
}

export interface PurchaseDTO {
  id: string
  purchaseDate: string
  sourceType?: string | null
  sourceName?: string | null
  extraCosts?: number | null
  notes?: string | null
  totalCost?: number | null
  lines: PurchaseLineDTO[]
  createdAt: string
}

function toPurchaseDTO(doc: any): PurchaseDTO {
  const lines = Array.isArray(doc.lines) ? doc.lines : []
  return {
    id: String(doc.id),
    purchaseDate: doc.purchase_date ?? '',
    sourceType: doc.source_type ?? null,
    sourceName: doc.source_name ?? null,
    extraCosts: doc.extra_costs != null ? Number(doc.extra_costs) : null,
    notes: doc.notes ?? null,
    totalCost: doc.total_cost != null ? Number(doc.total_cost) : null,
    lines: lines.map((l: any) => ({
      productId: l.product ? String(l.product.id ?? l.product) : '',
      title: typeof l.product === 'object' ? l.product.title || 'Prodotto' : 'Prodotto',
      quantity: Number(l.quantity) || 0,
      unitCost: Number(l.unit_cost) || 0,
      effectiveUnitCost: Number(l.effective_unit_cost) || 0,
      remainingQuantity: Number(l.remaining_quantity ?? l.quantity) || 0,
    })),
    createdAt: doc.createdAt ?? new Date().toISOString(),
  }
}

export async function getPurchases(opts: { search?: string; page?: number; limit?: number } = {}): Promise<{ docs: PurchaseDTO[]; total: number; totalPages: number }> {
  await requireAuth()
  const payload = await getPayloadClient()
  const page = opts.page || 1
  const limit = opts.limit || 25
  const where: any = {}
  if (opts.search) {
    where.or = [
      { source_name: { contains: opts.search } },
      { source_type: { contains: opts.search } },
      { notes: { contains: opts.search } },
    ]
  }
  const res = await payload.find({ overrideAccess: true, 
    collection: 'purchases',
    where,
    page,
    limit,
    sort: '-purchase_date',
    depth: 1,
  })
  return {
    docs: res.docs.map(toPurchaseDTO),
    total: res.totalDocs,
    totalPages: res.totalPages,
  }
}

export interface CreatePurchaseLineInput {
  productId?: string | number | null
  newProductTitle?: string | null
  newProductPrice?: number | null
  newProductCategory?: string | number | null
  newProductCollection?: string | number | null
  newProductImageLink?: string | null
  quantity: number
  unitCost: number
}

export interface CreatePurchaseInput {
  purchaseDate: string
  sourceType?: string | null
  sourceName?: string | null
  extraCosts?: number | null
  notes?: string | null
  lines: CreatePurchaseLineInput[]
}

export async function createPurchase(data: CreatePurchaseInput): Promise<PurchaseDTO> {
  await requireAuth()
  const payload = await getPayloadClient()

  const purchaseDate = (data.purchaseDate || '').trim()
  if (!purchaseDate) throw new Error('La data di acquisto è obbligatoria')

  const lines: { product: number; quantity: number; unit_cost: number }[] = []
  for (const line of data.lines ?? []) {
    const quantity = Number(line.quantity) || 0
    const unitCost = Number(line.unitCost) || 0
    if (quantity <= 0) continue

    let productId = line.productId ? Number(line.productId) : undefined
    if (!productId) {
      const title = (line.newProductTitle || '').trim()
      if (!title) throw new Error('Ogni riga deve avere un prodotto esistente o un nuovo titolo')
      const created = await createProduct({
        title,
        price: line.newProductPrice ?? undefined,
        category: line.newProductCategory || undefined,
        collection: line.newProductCollection || undefined,
        imageLink: line.newProductImageLink || undefined,
        quantity: 0,
        status: 'listed',
      })
      productId = Number(created.id)
    }

    lines.push({ product: productId, quantity, unit_cost: unitCost })
  }

  if (lines.length === 0) throw new Error('Aggiungi almeno una riga con quantità maggiore di 0')

  const res = await payload.create({ overrideAccess: true, 
    collection: 'purchases',
    data: {
      purchase_date: purchaseDate,
      source_type: data.sourceType || undefined,
      source_name: (data.sourceName || '').trim() || undefined,
      extra_costs: data.extraCosts ?? 0,
      notes: (data.notes || '').trim() || undefined,
      lines,
    } as any,
  })

  await applyStockDelta(payload, purchaseStockDelta(res.lines ?? []))
  return toPurchaseDTO(res)
}

export async function deletePurchase(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  const deleted = await payload.delete({ overrideAccess: true,  collection: 'purchases', id })
  await applyPurchaseDeletion(payload, deleted as { lines?: { product?: unknown; quantity?: number; remaining_quantity?: number }[] })
}

export async function updatePurchase(id: string, data: CreatePurchaseInput): Promise<PurchaseDTO> {
  await requireAuth()
  logAudit('purchase.update', { id, lines: (data.lines ?? []).length })
  const payload = await getPayloadClient()

  const purchaseDate = (data.purchaseDate || '').trim()
  if (!purchaseDate) throw new Error('La data di acquisto è obbligatoria')

  const existing = await payload.findByID({ overrideAccess: true,  collection: 'purchases', id, depth: 1 })
  if (!existing) throw new Error('Lotto non trovato')

  const oldLines = Array.isArray(existing.lines) ? existing.lines : []
  const oldByProduct = new Map<number, { id?: string | null; quantity: number; remaining: number }>()
  for (const line of oldLines) {
    const pid = productIdFrom(line.product)
    if (!pid) continue
    const qty = Number(line.quantity) || 0
    oldByProduct.set(pid, {
      id: (line as { id?: string | null }).id ?? null,
      quantity: qty,
      remaining: Number((line as { remaining_quantity?: number }).remaining_quantity ?? qty) || 0,
    })
  }

  const newLines: Array<{ id?: string; product: number; quantity: number; unit_cost: number; remaining_quantity: number }> = []
  const newDelta = new Map<number, number>()
  for (const line of data.lines ?? []) {
    const quantity = Number(line.quantity) || 0
    const unitCost = Number(line.unitCost) || 0
    if (quantity <= 0) continue

    let productId = line.productId ? Number(line.productId) : undefined
    if (!productId) {
      const title = (line.newProductTitle || '').trim()
      if (!title) throw new Error('Ogni riga deve avere un prodotto esistente o un nuovo titolo')
      const created = await createProduct({
        title,
        price: line.newProductPrice ?? undefined,
        category: line.newProductCategory || undefined,
        collection: line.newProductCollection || undefined,
        imageLink: line.newProductImageLink || undefined,
        quantity: 0,
        status: 'listed',
      })
      productId = Number(created.id)
    }

    const old = oldByProduct.get(productId)
    const newRemaining = old
      ? Math.min(quantity, Math.max(0, old.remaining + (quantity - old.quantity)))
      : quantity

    newLines.push({
      ...(old?.id ? { id: old.id } : {}),
      product: productId,
      quantity,
      unit_cost: unitCost,
      remaining_quantity: newRemaining,
    })
    newDelta.set(productId, (newDelta.get(productId) ?? 0) + quantity)
  }

  if (newLines.length === 0) throw new Error('Aggiungi almeno una riga con quantità maggiore di 0')

  const delta = new Map<number, number>()
  for (const [pid, qty] of oldByProduct) delta.set(pid, -qty)
  for (const [pid, qty] of newDelta) delta.set(pid, (delta.get(pid) ?? 0) + qty)

  const res = await payload.update({ overrideAccess: true, 
    collection: 'purchases',
    id,
    data: {
      purchase_date: purchaseDate,
      source_type: data.sourceType || undefined,
      source_name: (data.sourceName || '').trim() || undefined,
      extra_costs: data.extraCosts ?? 0,
      notes: (data.notes || '').trim() || undefined,
      lines: newLines,
    } as any,
    depth: 1,
  })

  await applyStockDelta(payload, delta)
  return toPurchaseDTO(res)
}

export interface PurchaseHistoryEntry {
  purchaseId: string
  purchaseDate: string
  sourceName?: string | null
  sourceType?: string | null
  quantity: number
  unitCost: number
  effectiveUnitCost: number
  remainingQuantity: number
}

export async function getPurchaseHistory(productId: string): Promise<PurchaseHistoryEntry[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const pid = Number(productId)
  const entries: PurchaseHistoryEntry[] = []
  let page = 1
  const pageSize = 100
  for (;;) {
    const res = await payload.find({ overrideAccess: true, 
      collection: 'purchases',
      page,
      limit: pageSize,
      sort: 'purchase_date',
      depth: 1,
    })
    for (const doc of res.docs) {
      for (const line of doc.lines ?? []) {
        const lineProduct = typeof line.product === 'object' ? Number(line.product.id) : Number(line.product)
        if (lineProduct !== pid) continue
        entries.push({
          purchaseId: String(doc.id),
          purchaseDate: doc.purchase_date ?? '',
          sourceName: doc.source_name ?? null,
          sourceType: doc.source_type ?? null,
          quantity: Number(line.quantity) || 0,
          unitCost: Number(line.unit_cost) || 0,
          effectiveUnitCost: Number(line.effective_unit_cost) || 0,
          remainingQuantity: Number(line.remaining_quantity ?? line.quantity) || 0,
        })
      }
    }
    if (page >= res.totalPages) break
    page += 1
  }
  return entries
}

const SALES_CHANNEL_MAP: Record<string, SalesChannel> = {
  vinted: 'vinted',
  ebay: 'ebay',
  cardmarket: 'cardmarket',
  wallapop: 'other',
  subito: 'other',
  altro: 'other',
  other: 'other',
}

function normalizeChannel(platform: string): SalesChannel {
  return SALES_CHANNEL_MAP[platform.toLowerCase()] ?? 'other'
}

export async function recordExternalSale(data: {
  productId: string
  quantity: number
  platform: string // vinted, ebay, cardmarket, other (wallapop/subito/altro → other)
  salePrice: number
}): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()

  const prodRes = await payload.findByID({ overrideAccess: true,  collection: 'products', id: data.productId })
  if (!prodRes) throw new Error('Prodotto non trovato in inventario')

  const soldQty = Math.max(1, data.quantity)
  const channel = normalizeChannel(data.platform)
  const transactionId = `EXT-${channel.toUpperCase()}-${Date.now()}`
  logAudit('sale.external', { productId: data.productId, quantity: soldQty, channel, value: data.salePrice * soldQty })

  await recordSale(payload, {
    transactionId,
    channel,
    email: `ext-${channel}@darkcardcollection.com`,
    items: [{ productId: Number(data.productId), quantity: soldQty, price: data.salePrice }],
    value: data.salePrice * soldQty,
    currency: 'EUR',
  })
}
