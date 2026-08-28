/**
 * Pure cost math for the procurement module (Dark Card Collection).
 * Ported from the legacy Payload logic (`src/lib/purchase-math.ts` + `record-sale.ts`):
 *  - `effective_unit_cost = unit_cost × (1 + extra_costs/subtotal)`; if subtotal is 0,
 *    extra costs are split equally per unit.
 *  - FIFO consumption allocates quantities from the oldest purchase lines first.
 */

export interface EffectiveLineInput {
  quantity: number
  unit_cost: number
}

export interface EffectiveCostResult {
  /** Effective unit cost for each line (same order as input). */
  effectiveCosts: number[]
  /** Subtotal (Σ qty × unit_cost) + extra_costs. */
  totalCost: number
}

export function computeEffectiveUnitCosts(
  lines: EffectiveLineInput[],
  extraCosts: number,
): EffectiveCostResult {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_cost, 0)
  const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0)
  const multiplier = subtotal > 0 ? 1 + extraCosts / subtotal : 0
  const effectiveCosts = lines.map((l) => {
    if (subtotal > 0) return l.unit_cost * multiplier
    if (totalQty > 0) return extraCosts / totalQty
    return 0
  })
  return { effectiveCosts, totalCost: subtotal + extraCosts }
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export interface AverageCostLine {
  effective_unit_cost: number
  remaining_quantity: number
}

/** Weighted average of the remaining (in-stock) quantities. */
export function computeAverageCost(lines: AverageCostLine[]): number {
  const totalQty = lines.reduce((sum, l) => sum + l.remaining_quantity, 0)
  if (totalQty === 0) return 0
  const totalCost = lines.reduce(
    (sum, l) => sum + l.remaining_quantity * l.effective_unit_cost,
    0,
  )
  return totalCost / totalQty
}

export interface FifoLine {
  lineId: string
  effective_unit_cost: number
  remaining_quantity: number
  /** Purchase date of the lot, ISO string or null. */
  purchase_date: string | null
}

export interface FifoAllocation {
  lineId: string
  quantity: number
  effective_unit_cost: number
}

/**
 * FIFO allocation: consumes from the oldest lines (by purchase date, then line id).
 * Returns the allocations and does NOT mutate the input.
 */
export function allocateFifo(lines: FifoLine[], quantity: number): FifoAllocation[] {
  const sorted = [...lines].sort((a, b) => {
    const da = a.purchase_date ?? "9999-99-99"
    const db = b.purchase_date ?? "9999-99-99"
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
        quantity: take,
        effective_unit_cost: line.effective_unit_cost,
      })
      remaining -= take
    }
  }
  return allocations
}

/** Weighted average effective cost of the allocated quantities. */
export function weightedAverageSnapshot(allocations: FifoAllocation[]): number {
  const totalQty = allocations.reduce((sum, a) => sum + a.quantity, 0)
  if (totalQty === 0) return 0
  const totalCost = allocations.reduce(
    (sum, a) => sum + a.quantity * a.effective_unit_cost,
    0,
  )
  return totalCost / totalQty
}