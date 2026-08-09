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
  itemId?: string | null
  description?: string | null
  storePrice?: number | null
  price?: number | null
  compareAtPrice?: number | null
  status: string
  productState?: string | null
  isPreorder?: boolean | null
  condition?: string | null
  category?: { id: string; name: string } | null
  collection?: { id: string; name: string } | null
  language?: string | null
  cardNumber?: string | null
  rarity?: string | null
  quantity: number
  imageUrl?: string | null
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
  orderId?: string | null
  email?: string | null
  status: string
  total?: number | null
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
    itemId: doc.itemId ?? null,
    description: doc.description ?? null,
    storePrice: doc.storePrice ?? null,
    price: doc.price ?? null,
    compareAtPrice: doc.compareAtPrice ?? null,
    status: doc.status || 'listed',
    productState: doc.productState ?? null,
    isPreorder: doc.isPreorder ?? null,
    condition: doc.condition ?? null,
    category: doc.category ? { id: String(doc.category.id ?? doc.category), name: relName(doc.category) } : null,
    collection: doc.collection
      ? { id: String(doc.collection.id ?? doc.collection), name: relName(doc.collection) }
      : null,
    language: doc.language ?? null,
    cardNumber: doc.cardNumber ?? null,
    rarity: doc.rarity ?? null,
    quantity: doc.quantity ?? 0,
    imageUrl: doc.imageUrl ?? null,
    images: doc.images ?? null,
    averageSalePrice: doc.averageSalePrice ?? null,
    lastPriceUpdate: doc.lastPriceUpdate ?? null,
    featured: doc.featured ?? null,
    isVisible: doc.isVisible ?? true,
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
    orderId: doc.orderId ?? null,
    email: doc.email ?? null,
    status: doc.status || 'pending',
    total: doc.total ?? null,
    createdAt: doc.createdAt ?? new Date().toISOString(),
    itemCount: orderItems.reduce((acc: number, item) => acc + item.quantity, 0),
    stripeSessionId: doc.stripeSessionId ?? null,
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
  const visible = products.filter((p) => p.isVisible !== false)
  const lowStock = products.filter((p) => p.isVisible !== false && (Number(p.quantity) || 0) <= 1)
  const inventoryValue = listed
    .filter((p) => p.isVisible !== false)
    .reduce((sum, p) => sum + (Number(p.storePrice) || 0) * (Number(p.quantity) || 0), 0)

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
    if (PAID_STATUSES.includes(status)) revenue += Number(o.total) || 0
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
}

export async function searchProducts(filters: ProductFilters = {}): Promise<ProductDTO[]> {
  await requireAuth()
  const payload = await getPayloadClient()

  const where: any[] = []
  const q = (filters.search || '').trim()
  if (q) {
    where.push({
      or: [{ title: { contains: q } }, { itemId: { contains: q } }, { description: { contains: q } }],
    })
  }
  if (filters.status) where.push({ status: { equals: filters.status } })
  if (filters.category) where.push({ category: { equals: Number(filters.category) } })
  if (filters.collection) where.push({ collection: { equals: Number(filters.collection) } })
  if (filters.withImage === 'yes') where.push({ imageUrl: { exists: true } })
  if (filters.withImage === 'no') where.push({ imageUrl: { exists: false } })

  const res = await payload.find({
    collection: 'products',
    where: where.length > 0 ? ({ and: where } as any) : undefined,
    limit: filters.limit || 500,
    sort: '-createdAt',
    depth: 1,
    draft: false,
  })
  return res.docs.map(toProductDTO)
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
  itemId?: string | null
  description?: string | null
  storePrice?: number | null
  price?: number | null
  compareAtPrice?: number | null
  status?: string
  productState?: string | null
  isPreorder?: boolean
  condition?: string
  category?: string | number | null
  collection?: string | number | null
  language?: string
  cardNumber?: string | null
  rarity?: string | null
  quantity?: number
  imageUrl?: string | null
  featured?: boolean
  isVisible?: boolean
}

export type CreateProductData = UpdateProductPatch

export async function updateProduct(id: string, patch: UpdateProductPatch): Promise<ProductDTO> {
  await requireAuth()
  const payload = await getPayloadClient()

  const data: Record<string, any> = {}
  const keys: (keyof UpdateProductPatch)[] = [
    'title',
    'slug',
    'itemId',
    'description',
    'storePrice',
    'price',
    'compareAtPrice',
    'status',
    'productState',
    'isPreorder',
    'condition',
    'category',
    'collection',
    'language',
    'cardNumber',
    'rarity',
    'quantity',
    'imageUrl',
    'featured',
    'isVisible',
  ]
  for (const key of keys) {
    if (key in patch) data[key] = patch[key] ?? undefined
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
      itemId: data.itemId || undefined,
      description: data.description || undefined,
      storePrice: data.storePrice ?? undefined,
      price: data.price ?? undefined,
      compareAtPrice: data.compareAtPrice ?? undefined,
      status: data.status || 'listed',
      productState: data.productState || undefined,
      isPreorder: data.isPreorder ?? false,
      condition: data.condition || 'near-mint',
      category: data.category || undefined,
      collection: data.collection || undefined,
      language: data.language || 'italian',
      cardNumber: data.cardNumber || undefined,
      rarity: data.rarity || undefined,
      quantity: data.quantity ?? 1,
      imageUrl: data.imageUrl || undefined,
      featured: data.featured ?? false,
      isVisible: data.isVisible ?? true,
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
