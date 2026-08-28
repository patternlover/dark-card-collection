import {
  allocateFifo,
  computeAverageCost,
  computeEffectiveUnitCosts,
  roundMoney,
  weightedAverageSnapshot,
  FifoLine,
} from "../utils/cost"

describe("computeEffectiveUnitCosts", () => {
  it("keeps unit costs unchanged when there are no extra costs", () => {
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

  it("allocates extra costs pro-rata by line value (uniform multiplier)", () => {
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts(
      [
        { quantity: 10, unit_cost: 25 },
        { quantity: 10, unit_cost: 30 },
      ],
      50,
    )
    expect(effectiveCosts[0]).toBeCloseTo(25 * (1 + 50 / 550), 5)
    expect(effectiveCosts[1]).toBeCloseTo(30 * (1 + 50 / 550), 5)
    expect(totalCost).toBe(600)
  })

  it("splits extra costs equally per unit when subtotal is zero", () => {
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

  it("returns empty costs for an empty lines array", () => {
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts([], 10)
    expect(effectiveCosts).toEqual([])
    expect(totalCost).toBe(10)
  })
})

describe("computeAverageCost", () => {
  it("computes the weighted average of effective unit costs over remaining quantities", () => {
    const avg = computeAverageCost([
      { effective_unit_cost: 25, remaining_quantity: 10 },
      { effective_unit_cost: 30, remaining_quantity: 10 },
    ])
    expect(avg).toBe(27.5)
  })

  it("returns 0 when there are no lines in stock", () => {
    expect(computeAverageCost([])).toBe(0)
    expect(computeAverageCost([{ effective_unit_cost: 25, remaining_quantity: 0 }])).toBe(0)
  })
})

describe("roundMoney", () => {
  it("rounds to two decimals", () => {
    expect(roundMoney(27.2727272727)).toBe(27.27)
    expect(roundMoney(27.275)).toBe(27.28)
  })
})

describe("allocateFifo", () => {
  const base = (overrides: Partial<FifoLine> & { lineId: string }): FifoLine => ({
    effective_unit_cost: 0,
    remaining_quantity: 0,
    purchase_date: null,
    ...overrides,
  })

  it("consumes oldest lines first", () => {
    const lines = [
      base({ lineId: "new", effective_unit_cost: 30, remaining_quantity: 4, purchase_date: "2026-02-01" }),
      base({ lineId: "old", effective_unit_cost: 25, remaining_quantity: 6, purchase_date: "2026-01-01" }),
    ]
    const alloc = allocateFifo(lines, 8)
    expect(alloc).toEqual([
      { lineId: "old", quantity: 6, effective_unit_cost: 25 },
      { lineId: "new", quantity: 2, effective_unit_cost: 30 },
    ])
  })

  it("consumes partially when a line has more stock than needed", () => {
    const lines = [base({ lineId: "l1", effective_unit_cost: 25, remaining_quantity: 10 })]
    const alloc = allocateFifo(lines, 3)
    expect(alloc).toEqual([{ lineId: "l1", quantity: 3, effective_unit_cost: 25 }])
  })

  it("returns nothing for empty lines", () => {
    expect(allocateFifo([], 5)).toEqual([])
  })

  it("treats null purchase_date lines as last", () => {
    const lines = [
      base({ lineId: "a", effective_unit_cost: 25, remaining_quantity: 5, purchase_date: null }),
      base({ lineId: "b", effective_unit_cost: 20, remaining_quantity: 5, purchase_date: "2026-01-01" }),
    ]
    const alloc = allocateFifo(lines, 10)
    expect(alloc.map((a) => a.lineId)).toEqual(["b", "a"])
  })
})

describe("weightedAverageSnapshot", () => {
  it("computes the weighted average of consumed quantities", () => {
    const avg = weightedAverageSnapshot([
      { lineId: "a", quantity: 6, effective_unit_cost: 25 },
      { lineId: "b", quantity: 2, effective_unit_cost: 30 },
    ])
    expect(avg).toBe(26.25)
  })

  it("returns 0 for no allocations", () => {
    expect(weightedAverageSnapshot([])).toBe(0)
  })
})