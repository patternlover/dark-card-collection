'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { runReadOnlyQuery, type QueryOutcome } from '@/lib/db-query'
import { isAuthed, clearDashSession } from '@/lib/dash-auth'

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

export interface ProductDTO {
  id: string
  title: string
  itemId?: string | null
  storePrice?: number | null
  compareAtPrice?: number | null
  status: string
  quantity: number
  isVisible: boolean
  featured?: boolean | null
  isPreorder?: boolean | null
}

export interface OrderDTO {
  id: string
  orderId?: string | null
  email?: string | null
  status: string
  total?: number | null
  createdAt: string
  itemCount: number
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

function toProductDTO(doc: any): ProductDTO {
  return {
    id: doc.id,
    title: doc.title || '',
    itemId: doc.itemId ?? null,
    storePrice: doc.storePrice ?? null,
    compareAtPrice: doc.compareAtPrice ?? null,
    status: doc.status || 'listed',
    quantity: doc.quantity ?? 0,
    isVisible: doc.isVisible ?? true,
    featured: doc.featured ?? null,
    isPreorder: doc.isPreorder ?? null,
  }
}

function toOrderDTO(doc: any): OrderDTO {
  const items = Array.isArray(doc.items) ? doc.items : []
  return {
    id: doc.id,
    orderId: doc.orderId ?? null,
    email: doc.email ?? null,
    status: doc.status || 'pending',
    total: doc.total ?? null,
    createdAt: doc.createdAt ?? new Date().toISOString(),
    itemCount: items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0),
  }
}

export async function getOverview(): Promise<OverviewData> {
  await requireAuth()
  const payload = await getPayloadClient()

  const [productsRes, ordersRes] = await Promise.all([
    payload.find({ collection: 'products', limit: 1000, draft: false }),
    payload.find({ collection: 'orders', limit: 1000, sort: '-createdAt', draft: false }),
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

export async function searchProducts(query: string): Promise<ProductDTO[]> {
  await requireAuth()
  const payload = await getPayloadClient()
  const q = query.trim()
  const where: any = q
    ? {
        or: [
          { title: { like: q } },
          { itemId: { like: q } },
          { description: { like: q } },
        ],
      }
    : {}
  const res = await payload.find({
    collection: 'products',
    where,
    limit: 60,
    sort: 'updatedAt',
    draft: false,
  })
  return res.docs.map(toProductDTO)
}

export interface UpdateProductPatch {
  storePrice?: number | null
  compareAtPrice?: number | null
  status?: string
  quantity?: number
  isVisible?: boolean
  featured?: boolean
}

export async function updateProduct(id: string, patch: UpdateProductPatch): Promise<ProductDTO> {
  await requireAuth()
  const payload = await getPayloadClient()
  const res = await payload.update({
    collection: 'products',
    id,
    data: patch as any,
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
    draft: false,
  })
  return toOrderDTO(res)
}

export async function runQuery(sql: string): Promise<QueryOutcome> {
  await requireAuth()
  return runReadOnlyQuery(sql)
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAuth()
  const payload = await getPayloadClient()
  await payload.delete({ collection: 'products', id })
}
