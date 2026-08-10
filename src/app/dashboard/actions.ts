'use server'

import { redirect } from 'next/navigation'
import { runReadOnlyQuery, isDashSqlEnabled, type QueryOutcome } from '@/lib/db-query'
import { getPayloadClient } from '@/lib/payload'
import { isAuthed, clearDashSession } from '@/lib/dash-auth'
import { slugify } from '@/lib/slug'

async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) {
    throw new Error('Unauthorized')
  }
}

export async function logout(): Promise<void> {
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
}

export interface OrderDTO {
  id: string
  transactionId?: string | null
  email?: string | null
  status: string
  value?: number | null
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
  }))
  return {
    id: doc.id,
    transactionId: doc.transaction_id ?? null,
    email: doc.email ?? null,
    status: doc.status || 'pending',
    value: doc.value ?? null,
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
      payload.find({ collection: 'orders', limit: 8, sort: '-createdAt', depth: 1, draft: false }),
    ),
  ])

  if (pRes.error || oRes.error) {
    const payload = await getPayloadClient()
    const [productsRes, allOrdersRes] = await Promise.all([
      payload.find({ collection: 'products', limit: 1000, draft: false }),
      payload.find({ collection: 'orders', limit: 1000, sort: '-createdAt', depth: 1, draft: false }),
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

  const res = await payload.find({
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
  const res = await payload.find({ collection: 'categories', limit: 500, sort: 'name' })
  return res.docs.map((d: any) => ({ id: String(d.id), name: d.name }))
}

export async function getCollections(): Promise<CollectionOption[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'collections', limit: 500, sort: 'name' })
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

  const res = await payload.update({
    collection: 'products',
    id,
    data: data as any,
    depth: 1,
    draft: false,
  })
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
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: candidate } },
      limit: 1,
    })
    if (existing.docs.length === 0) break
    candidate = `${slug}-${i++}`
  }

  const res = await payload.create({
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
  const res = await payload.find({
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
  const payload = await getPayloadClient()
  const res = await payload.update({
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

export async function deleteProduct(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ collection: 'products', id })
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
  const res = await payload.find({ collection: 'categories', limit: 500, sort: 'name', draft: false })
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
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: candidate } }, limit: 1 })
    if (existing.docs.length === 0) break
    candidate = `${slug}-${i++}`
  }

  const res = await payload.create({
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
  const res = await payload.update({ collection: 'categories', id, data: patch as any })
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
  await payload.delete({ collection: 'categories', id })
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
  const res = await payload.find({ collection: 'collections', limit: 500, sort: 'name', draft: false })
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
    const existing = await payload.find({ collection: 'collections', where: { slug: { equals: candidate } }, limit: 1 })
    if (existing.docs.length === 0) break
    candidate = `${slug}-${i++}`
  }

  const res = await payload.create({
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
  const res = await payload.update({ collection: 'collections', id, data: patch as any })
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
  await payload.delete({ collection: 'collections', id })
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
  const res = await payload.find({
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
  const res = await payload.findByID({ collection: 'messages', id, draft: false })
  return (res as any).message ?? null
}

export async function toggleMessageRead(id: string, read: boolean): Promise<{ id: string; read: boolean }> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.update({ collection: 'messages', id, data: { read } as any })
  return { id: String(id), read }
}

export async function toggleMessageReplied(id: string, replied: boolean): Promise<{ id: string; replied: boolean }> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.update({ collection: 'messages', id, data: { replied } as any })
  return { id: String(id), replied }
}

export async function deleteMessage(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ collection: 'messages', id })
}

export interface SiteSettingsDTO {
  siteName?: string | null
  description?: string | null
}

export async function getSiteSettings(): Promise<SiteSettingsDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const g = await payload.findGlobal({ slug: 'site-settings', draft: false })
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
  const g = await payload.updateGlobal({ slug: 'site-settings', data: patch as any })
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
  const g = await payload.findGlobal({ slug: 'header', depth: 1, draft: false })
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
  const g = await payload.updateGlobal({ slug: 'header', data: patch as any })
  const logo = (g as any).logo
  return {
    logoId: logo ? String(logo.id ?? logo) : null,
    navItems: Array.isArray((g as any).navItems)
      ? (g as any).navItems.map((n: any) => ({ id: n.id, label: n.label || '', url: n.url || '' }))
      : [],
  }
}

export interface PurchaseDTO {
  id: string
  title: string
  costOfGoodsSold: number
  quantity: number
  store?: string | null
  purchaseDate?: string | null
  notes?: string | null
  status?: string | null
  linkedProductId?: string | null
}

export async function getPurchases(opts: { search?: string; page?: number; limit?: number } = {}): Promise<{ docs: PurchaseDTO[]; total: number; totalPages: number }> {
  await requireAuth()
  const payload = await getPayloadClient()
  const page = opts.page || 1
  const limit = opts.limit || 25
  const where: any = {}
  if (opts.search) {
    where.or = [
      { title: { contains: opts.search } },
      { store: { contains: opts.search } },
    ]
  }
  const res = await payload.find({
    collection: 'purchases',
    where,
    page,
    limit,
    sort: '-purchase_date',
    depth: 1,
  })
  return {
    docs: res.docs.map((d: any) => ({
      id: String(d.id),
      title: d.title || '',
      costOfGoodsSold: d.cost_of_goods_sold ?? 0,
      quantity: d.quantity ?? 1,
      store: d.store ?? null,
      purchaseDate: d.purchase_date ?? null,
      notes: d.notes ?? null,
      status: d.status ?? 'received',
      linkedProductId: d.linked_product ? String(d.linked_product.id ?? d.linked_product) : null,
    })),
    total: res.totalDocs,
    totalPages: res.totalPages,
  }
}

export async function createPurchase(data: {
  title: string
  costOfGoodsSold: number
  quantity: number
  store?: string | null
  purchaseDate?: string | null
  notes?: string | null
  status?: string | null
  autoCreateProduct?: boolean
  productPrice?: number | null
  category?: string | number | null
  collection?: string | number | null
  imageLink?: string | null
}): Promise<PurchaseDTO> {
  await requireAuth()
  const payload = await getPayloadClient()

  const title = (data.title || '').trim()
  if (!title) throw new Error('Il titolo è obbligatorio')

  let productId: string | undefined = undefined

  if (data.autoCreateProduct !== false) {
    const prodRes = await createProduct({
      title,
      costOfGoodsSold: data.costOfGoodsSold,
      quantity: data.quantity,
      price: data.productPrice ?? (data.costOfGoodsSold ? Number((data.costOfGoodsSold * 1.3).toFixed(2)) : 0),
      status: 'listed',
      category: data.category || undefined,
      collection: data.collection || undefined,
      imageLink: data.imageLink || undefined,
    })
    productId = prodRes.id
  }

  const res = await payload.create({
    collection: 'purchases',
    data: {
      title,
      cost_of_goods_sold: data.costOfGoodsSold,
      quantity: data.quantity,
      store: data.store || undefined,
      purchase_date: data.purchaseDate || undefined,
      notes: data.notes || undefined,
      status: data.status || 'received',
      linked_product: productId ? Number(productId) : undefined,
    } as any,
  })

  return {
    id: String(res.id),
    title: (res as any).title || '',
    costOfGoodsSold: (res as any).cost_of_goods_sold ?? 0,
    quantity: (res as any).quantity ?? 1,
    store: (res as any).store ?? null,
    purchaseDate: (res as any).purchase_date ?? null,
    notes: (res as any).notes ?? null,
    status: (res as any).status ?? 'received',
    linkedProductId: productId || null,
  }
}

export async function deletePurchase(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ collection: 'purchases', id })
}

export async function recordExternalSale(data: {
  productId: string
  quantity: number
  platform: string // vinted, wallapop, ebay, subito, altro
  salePrice: number
}): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()

  const prodRes = await payload.findByID({ collection: 'products', id: data.productId })
  if (!prodRes) throw new Error('Prodotto non trovato in inventario')

  const currentQty = (prodRes as any).quantity ?? 0
  const soldQty = Math.max(1, data.quantity)
  const newQty = Math.max(0, currentQty - soldQty)
  const newStatus = newQty === 0 ? 'sold' : (prodRes as any).status

  await payload.update({
    collection: 'products',
    id: data.productId,
    data: {
      quantity: newQty,
      status: newStatus,
    },
  })

  const transactionId = `EXT-${data.platform.toUpperCase()}-${Date.now()}`
  const totalValue = data.salePrice * soldQty

  await payload.create({
    collection: 'orders',
    data: {
      transaction_id: transactionId,
      customer_name: `Vendita Esterna (${data.platform})`,
      customer_email: `ext-${data.platform.toLowerCase()}@darkcardcollection.com`,
      items: [
        {
          product: Number(data.productId),
          title: (prodRes as any).title || 'Prodotto',
          quantity: soldQty,
          price: data.salePrice,
        },
      ],
      value: totalValue,
      currency: 'EUR',
      shipping: 0,
      tax: 0,
      status: 'completed',
    } as any,
  })
}
