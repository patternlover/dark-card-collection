import type { Payload } from 'payload'
import { roundMoney } from './purchase-math'
import { productIdFrom } from './inventory'
import { logAudit } from './audit'

export type SalesChannel = 'website' | 'vinted' | 'ebay' | 'cardmarket' | 'other'

export interface SaleItemInput {
  productId: number
  quantity: number
  price: number
}

export interface RecordSaleArgs {
  transactionId: string
  channel: SalesChannel
  email: string
  items: SaleItemInput[]
  value: number
  currency?: string
  shipping?: number
  tax?: number
  stripeSessionId?: string
}

export interface SaleLine {
  lineId: string
  purchaseId: number
  productId: number
  effective_unit_cost: number
  remaining_quantity: number
  purchase_date: string | null
}

export interface FifoAllocation {
  lineId: string
  purchaseId: number
  quantity: number
  effective_unit_cost: number
}

export interface RecordSaleResultItem {
  productId: number
  quantity: number
  price: number
  unitCostSnapshot: number
  productTitle: string
}

export interface RecordSaleResult {
  orderId: number
  items: RecordSaleResultItem[]
}

export function allocateFifo(lines: SaleLine[], quantity: number): FifoAllocation[] {
  const sorted = [...lines].sort((a, b) => {
    const da = a.purchase_date ?? '9999-99-99'
    const db = b.purchase_date ?? '9999-99-99'
    if (da !== db) return da < db ? -1 : 1
    return a.lineId < b.lineId ? -1 : 1
  })
  const allocations: FifoAllocation[] = []
  let remaining = quantity
  for (const line of sorted) {
    if (remaining <= 0) break
    const take = Math.min(remaining, line.remaining_quantity)
    if (take > 0) {
      allocations.push({
        lineId: line.lineId,
        purchaseId: line.purchaseId,
        quantity: take,
        effective_unit_cost: line.effective_unit_cost,
      })
      remaining -= take
    }
  }
  return allocations
}

export function weightedAverageSnapshot(allocations: FifoAllocation[]): number {
  const totalQty = allocations.reduce((sum, a) => sum + a.quantity, 0)
  if (totalQty === 0) return 0
  const totalCost = allocations.reduce((sum, a) => sum + a.quantity * a.effective_unit_cost, 0)
  return totalCost / totalQty
}

async function loadLinesForProduct(payload: Payload, productId: number): Promise<SaleLine[]> {
  const lines: SaleLine[] = []
  let page = 1
  const pageSize = 100
  for (;;) {
    const result = await payload.find({ overrideAccess: true,  collection: 'purchases', page, limit: pageSize, depth: 0 })
    for (const doc of result.docs) {
      for (const line of doc.lines ?? []) {
        if (productIdFrom(line.product) !== productId) continue
        const remaining = Number(line.remaining_quantity ?? line.quantity ?? 0)
        if (remaining <= 0) continue
        lines.push({
          lineId: line.id ?? '',
          purchaseId: Number(doc.id),
          productId,
          effective_unit_cost: Number(line.effective_unit_cost ?? 0),
          remaining_quantity: remaining,
          purchase_date: (doc.purchase_date ?? null) as string | null,
        })
      }
    }
    if (page >= result.totalPages) break
    page += 1
  }
  return lines
}

export async function recordSale(payload: Payload, args: RecordSaleArgs): Promise<RecordSaleResult> {
  const merged = new Map<number, SaleItemInput>()
  for (const item of args.items) {
    if (item.productId <= 0) continue
    const existing = merged.get(item.productId)
    merged.set(item.productId, {
      productId: item.productId,
      quantity: (existing?.quantity ?? 0) + item.quantity,
      price: item.price,
    })
  }

  const products = new Map<number, { title: string; cost_of_goods_sold: number; quantity: number }>()
  const fifoLines = new Map<number, SaleLine[]>()

  for (const item of merged.values()) {
    const product = await payload.findByID({ overrideAccess: true,  collection: 'products', id: item.productId, depth: 0 })
    products.set(item.productId, {
      title: (product as { title?: string }).title || 'Prodotto',
      cost_of_goods_sold: Number((product as { cost_of_goods_sold?: number }).cost_of_goods_sold ?? 0),
      quantity: Number((product as { quantity?: number }).quantity ?? 0),
    })
    fifoLines.set(item.productId, await loadLinesForProduct(payload, item.productId))
  }

  const allocationsByProduct = new Map<number, FifoAllocation[]>()
  for (const item of merged.values()) {
    allocationsByProduct.set(item.productId, allocateFifo(fifoLines.get(item.productId) ?? [], item.quantity))
  }

  const orderItems = [...merged.values()].map((item) => {
    const allocations = allocationsByProduct.get(item.productId) ?? []
    const snapshot =
      allocations.length > 0
        ? weightedAverageSnapshot(allocations)
        : (products.get(item.productId)?.cost_of_goods_sold ?? 0)
    return {
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
      unit_cost_snapshot: roundMoney(snapshot),
    }
  })

  const order = await payload.create({ overrideAccess: true, 
    collection: 'orders',
    data: {
      transaction_id: args.transactionId,
      sales_channel: args.channel,
      status: 'paid',
      items: orderItems as any,
      value: args.value,
      currency: args.currency ?? 'EUR',
      shipping: args.shipping ?? 0,
      tax: args.tax ?? 0,
      email: args.email,
      ...(args.stripeSessionId ? { stripe_session_id: args.stripeSessionId } : {}),
    } as any,
  })

  for (const item of merged.values()) {
    const currentQty = products.get(item.productId)?.quantity ?? 0
    await payload.update({ overrideAccess: true, 
      collection: 'products',
      id: item.productId,
      data: { quantity: Math.max(0, currentQty - item.quantity) },
    })
  }

  const byPurchase = new Map<number, Map<string, number>>()
  for (const allocations of allocationsByProduct.values()) {
    for (const allocation of allocations) {
      if (!allocation.lineId) continue
      if (!byPurchase.has(allocation.purchaseId)) byPurchase.set(allocation.purchaseId, new Map())
      const lineQuantities = byPurchase.get(allocation.purchaseId)!
      lineQuantities.set(allocation.lineId, (lineQuantities.get(allocation.lineId) ?? 0) + allocation.quantity)
    }
  }

  for (const [purchaseId, lineQuantities] of byPurchase) {
    const doc = await payload.findByID({ overrideAccess: true,  collection: 'purchases', id: purchaseId, depth: 0 })
    const lines = ((doc as { lines?: Array<{ id?: string | null; remaining_quantity?: number }> }).lines ?? []) as Array<{
      id?: string | null
      remaining_quantity?: number
    }>
    const updatedLines = lines.map((line) => {
      const consumed = line.id ? lineQuantities.get(line.id) : undefined
      if (consumed === undefined) return line
      return { ...line, remaining_quantity: Math.max(0, Number(line.remaining_quantity ?? 0) - consumed) }
    })
    await payload.update({ overrideAccess: true, 
      collection: 'purchases',
      id: purchaseId,
      data: { lines: updatedLines as any },
    })
  }

  return {
    orderId: Number(order.id),
    items: [...merged.values()].map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      unitCostSnapshot: roundMoney(
        allocationsByProduct.get(item.productId)?.length
          ? weightedAverageSnapshot(allocationsByProduct.get(item.productId)!)
          : (products.get(item.productId)?.cost_of_goods_sold ?? 0),
      ),
      productTitle: products.get(item.productId)?.title ?? 'Prodotto',
    })),
  }
}

export function auditSaleResult(result: RecordSaleResult, channel: SalesChannel): void {
  logAudit('sale.recorded', { orderId: result.orderId, channel, items: result.items.length })
}
