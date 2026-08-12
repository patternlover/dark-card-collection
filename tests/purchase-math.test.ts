import { describe, it, expect } from 'vitest'
import { computeEffectiveUnitCosts, computeAverageCost, roundMoney } from '@/lib/purchase-math'

describe('computeEffectiveUnitCosts', () => {
  it('keeps unit costs unchanged when there are no extra costs', () => {
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts(
      [
        { quantity: 10, unit_cost: 25 },
        { quantity: 10, unit_cost: 30 },
      ],
      0,
    )
    expect(effectiveCosts).toEqual([25, 30])
    expect(totalCost).toBe(550)
  })

  it('allocates extra costs pro-rata by line value (uniform multiplier)', () => {
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts(
      [
        { quantity: 10, unit_cost: 25 },
        { quantity: 10, unit_cost: 30 },
      ],
      50,
    )
    // multiplier = 1 + 50/550
    expect(effectiveCosts[0]).toBeCloseTo(25 * (1 + 50 / 550), 5)
    expect(effectiveCosts[1]).toBeCloseTo(30 * (1 + 50 / 550), 5)
    expect(totalCost).toBe(600)
  })

  it('splits extra costs equally per unit when subtotal is zero', () => {
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts(
      [
        { quantity: 5, unit_cost: 0 },
        { quantity: 5, unit_cost: 0 },
      ],
      100,
    )
    expect(effectiveCosts).toEqual([10, 10])
    expect(totalCost).toBe(100)
  })

  it('returns empty costs for an empty lines array', () => {
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts([], 10)
    expect(effectiveCosts).toEqual([])
    expect(totalCost).toBe(10)
  })
})

describe('computeAverageCost', () => {
  it('computes the weighted average of effective unit costs', () => {
    const avg = computeAverageCost([
      { quantity: 10, effective_unit_cost: 25 },
      { quantity: 10, effective_unit_cost: 30 },
    ])
    expect(avg).toBe(27.5)
  })

  it('returns 0 when there are no lines', () => {
    expect(computeAverageCost([])).toBe(0)
  })
})

describe('roundMoney', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney(27.2727272727)).toBe(27.27)
    expect(roundMoney(27.275)).toBe(27.28)
  })
})
