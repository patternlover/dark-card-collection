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

function safeNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function applyStockDelta(payload: Payload, delta: Map<number, number>): Promise<void> {
  for (const [productId, amount] of delta) {
    const safeAmount = safeNumber(amount)
    if (safeAmount === 0) continue
    const product = await payload.findByID({ overrideAccess: true,  collection: 'products', id: productId, depth: 0 })
    const currentQty = safeNumber((product as { quantity?: number }).quantity ?? 0)
    await payload.update({ overrideAccess: true, 
      collection: 'products',
      id: productId,
      data: { quantity: Math.max(0, currentQty + safeAmount) },
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

export interface OrderItemLike {
  product?: unknown
  quantity?: number | null
}

/**
 * Ripristina `remaining_quantity` delle righe lotto per un prodotto.
 * Distribuisce `quantity` da ripristinare sulle righe esistenti fino a
 * `quantity` per riga, in ordine FIFO (purchase_date ASC) — euristica
 * di inversione FIFO: totale ripristinato = sum(qty ordine) garantito,
 * distribuzione per lotto approssimata se storico ordini interleavato.
 */
export async function restoreRemainingForProduct(
  payload: Payload,
  productId: number,
  quantityToRestore: number,
): Promise<void> {
  let remaining = safeNumber(quantityToRestore)
  if (remaining <= 0) return

  // Carica tutti i purchases che contengono il prodotto, ordinati per purchase_date ASC (FIFO)
  const purchases: Array<{ id: number; purchase_date?: string | null; lines: Array<{ id?: string | null; product?: unknown; quantity?: number | null; remaining_quantity?: number | null; unit_cost?: number | null; effective_unit_cost?: number | null }> }> = []
  let page = 1
  const pageSize = 100
  for (;;) {
    const res = await payload.find({ overrideAccess: true, collection: 'purchases', page, limit: pageSize, depth: 0, sort: 'purchase_date' })
    for (const doc of res.docs as Array<{ id: number | string; purchase_date?: string | null; lines?: Array<{ id?: string | null; product?: unknown; quantity?: number | null; remaining_quantity?: number | null }> }>) {
      const hasProduct = (doc.lines ?? []).some((l) => productIdFrom(l.product) === productId)
      if (!hasProduct) continue
      purchases.push({ id: Number(doc.id), purchase_date: (doc as { purchase_date?: string | null }).purchase_date ?? null, lines: (doc.lines ?? []) as Array<{ id?: string | null; product?: unknown; quantity?: number | null; remaining_quantity?: number | null }> })
    }
    if (page >= res.totalPages) break
    page += 1
  }

  for (const purchase of purchases) {
    if (remaining <= 0) break
    let updated = false
    const newLines = purchase.lines.map((line) => {
      if (remaining <= 0) return line
      if (productIdFrom(line.product) !== productId) return line
      const qty = safeNumber(line.quantity ?? 0)
      const rem = safeNumber(line.remaining_quantity ?? qty)
      if (rem >= qty) return line
      const canRestore = Math.min(remaining, qty - rem)
      if (canRestore <= 0) return line
      remaining -= canRestore
      updated = true
      return { ...line, remaining_quantity: rem + canRestore }
    })
    if (updated) {
      await payload.update({ overrideAccess: true, collection: 'purchases', id: purchase.id, data: { lines: newLines as unknown as never[] } as never, depth: 0 })
    }
  }
}

export async function applyOrderDeletion(
  payload: Payload,
  orderDoc: { items?: OrderItemLike[] },
): Promise<void> {
  const items = orderDoc?.items ?? []
  // Raggruppa per productId (ordini possono avere più righe stesso prodotto)
  const byProduct = new Map<number, number>()
  for (const item of items) {
    const pid = productIdFrom(item.product)
    if (!pid) continue
    const qty = safeNumber(item.quantity ?? 0)
    if (qty <= 0) continue
    byProduct.set(pid, (byProduct.get(pid) ?? 0) + qty)
  }
  if (byProduct.size === 0) return

  // 1) Ripristina quantity su products (inverso di recordSale)
  const delta = new Map<number, number>()
  for (const [pid, qty] of byProduct) delta.set(pid, qty)
  await applyStockDelta(payload, delta)

  // 2) Ripristina remaining_quantity FIFO
  for (const [pid, qty] of byProduct) {
    await restoreRemainingForProduct(payload, pid, qty)
  }
}
