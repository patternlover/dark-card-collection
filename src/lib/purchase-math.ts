export interface PurchaseLineCostInput {
  quantity: number
  unit_cost: number
}

export interface PurchaseLineCost {
  quantity: number
  effective_unit_cost: number
}

export interface EffectiveCostResult {
  effectiveCosts: number[]
  totalCost: number
}

export function computeEffectiveUnitCosts(
  lines: PurchaseLineCostInput[],
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

export function computeAverageCost(lines: PurchaseLineCost[]): number {
  const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0)
  if (totalQty === 0) return 0
  const totalCost = lines.reduce((sum, l) => sum + l.quantity * l.effective_unit_cost, 0)
  return totalCost / totalQty
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
