'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { runReadOnlyQuery, type QueryOutcome } from '@/lib/db-query'
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

async function getPayloadClient() {
  return getPayload({ config })
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

export async function getOverview(): Promise<OverviewData> {
  await requireAuth()
  const payload = await getPayloadClient()

  const [productsRes, ordersRes] = await Promise.all([
    payload.find({ collection: 'products', limit: 1000, draft: false }),
    payload.find({ collection: 'orders', limit: 1000, sort: '-createdAt', depth: 1, draft: false }),
  ])

  const products = productsRes.docs
  const listed = products.filter((p) => p.status === 'listed')
  const hold = products.filter((p) => p.status === 'hold')
  const sold = products.filter((p) => p.status === 'sold')
  const visible = products.filter((p) => p.is_visible !== false)
  const lowStock = products.filter((p) => p.is_visible !== false && (Number(p.quantity) || 0) <= 1)
  const inventoryValue = listed
    .filter((p) => p.is_visible !== false)
    .reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 0), 0)

  const orders = ordersRes.docs
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
  return runReadOnlyQuery(sql)
}

export interface DbTableInfo {
  table: string
  rowCount: number
}

export async function getDbOverview(): Promise<DbTableInfo[]> {
  await requireAuth()
  const tablesRes = await runReadOnlyQuery(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
  )
  if (tablesRes.error) return []
  const tables = tablesRes.rows
    .map((r) => r.table_name)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)

  const result: DbTableInfo[] = []
  for (const table of tables) {
    const countRes = await runReadOnlyQuery(`SELECT COUNT(*) AS c FROM "${table}"`)
    const rowCount = countRes.error ? 0 : Number(countRes.rows[0]?.c || 0)
    result.push({ table, rowCount })
  }
  return result
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

export async function getMessages(): Promise<MessageDTO[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'messages', limit: 500, sort: '-createdAt', draft: false })
  return res.docs.map((d: any) => ({
    id: String(d.id),
    name: d.name || '',
    email: d.email || '',
    subject: d.subject ?? null,
    message: d.message ?? null,
    read: Boolean(d.read),
    replied: Boolean(d.replied),
    createdAt: d.createdAt ?? new Date().toISOString(),
  }))
}

export async function toggleMessageRead(id: string, read: boolean): Promise<MessageDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.update({ collection: 'messages', id, data: { read } as any })
  return {
    id: String(res.id),
    name: (res as any).name || '',
    email: (res as any).email || '',
    subject: (res as any).subject ?? null,
    message: (res as any).message ?? null,
    read: Boolean((res as any).read),
    replied: Boolean((res as any).replied),
    createdAt: (res as any).createdAt ?? new Date().toISOString(),
  }
}

export async function toggleMessageReplied(id: string, replied: boolean): Promise<MessageDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.update({ collection: 'messages', id, data: { replied } as any })
  return {
    id: String(res.id),
    name: (res as any).name || '',
    email: (res as any).email || '',
    subject: (res as any).subject ?? null,
    message: (res as any).message ?? null,
    read: Boolean((res as any).read),
    replied: Boolean((res as any).replied),
    createdAt: (res as any).createdAt ?? new Date().toISOString(),
  }
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
