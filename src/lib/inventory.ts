import type { Payload } from 'payload'
import { computeAverageCost, roundMoney } from './purchase-math'

export function productIdFrom(value: unknown): number | undefined {
  if (typeof value === 'number' && value > 0) return value
  if (value && typeof value === 'object') {
    const id = (value as { id?: number | string }).id
    if (id !== undefined && id !== null) {
      const n = Number(id)
      return Number.isFinite(n) && n > 0 ? n : undefined
    }
  }
  return undefined
}

export interface PurchaseLineLike {
  product?: unknown
  quantity?: number | null
  remaining_quantity?: number | null
}

export function purchaseStockDelta(lines: PurchaseLineLike[] | undefined): Map<number, number> {
  const delta = new Map<number, number>()
  for (const line of lines ?? []) {
    const pid = productIdFrom(line.product)
    if (!pid) continue
    delta.set(pid, (delta.get(pid) ?? 0) + Number(line.quantity ?? 0))
  }
  return delta
}

export async function recomputeAverageCost(payload: Payload, productId: number): Promise<void> {
  const lines: Array<{ quantity: number; effective_unit_cost: number }> = []
  let page = 1
  const pageSize = 100
  for (;;) {
    const result = await payload.find({ overrideAccess: true,  collection: 'purchases', page, limit: pageSize, depth: 0 })
    for (const doc of result.docs) {
      for (const line of doc.lines ?? []) {
        if (productIdFrom(line.product) === productId) {
          lines.push({
            quantity: Number(line.quantity ?? 0),
            effective_unit_cost: Number(line.effective_unit_cost ?? 0),
          })
        }
      }
    }
    if (page >= result.totalPages) break
    page += 1
  }
  await payload.update({ overrideAccess: true, 
    collection: 'products',
    id: productId,
    data: { cost_of_goods_sold: roundMoney(computeAverageCost(lines)) },
  })
}

export async function applyStockDelta(payload: Payload, delta: Map<number, number>): Promise<void> {
  for (const [productId, amount] of delta) {
    if (amount === 0) continue
    const product = await payload.findByID({ overrideAccess: true,  collection: 'products', id: productId, depth: 0 })
    const currentQty = Number((product as { quantity?: number }).quantity ?? 0)
    await payload.update({ overrideAccess: true, 
      collection: 'products',
      id: productId,
      data: { quantity: Math.max(0, currentQty + amount) },
    })
    await recomputeAverageCost(payload, productId)
  }
}

export async function applyPurchaseDeletion(payload: Payload, purchaseDoc: { lines?: PurchaseLineLike[] }): Promise<void> {
  const delta = new Map<number, number>()
  for (const line of purchaseDoc?.lines ?? []) {
    const pid = productIdFrom(line.product)
    if (!pid) continue
    const remaining = Number(line.remaining_quantity ?? line.quantity ?? 0)
    if (remaining <= 0) continue
    delta.set(pid, (delta.get(pid) ?? 0) - remaining)
  }
  await applyStockDelta(payload, delta)
}
