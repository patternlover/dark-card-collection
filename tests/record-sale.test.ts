import { describe, it, expect } from 'vitest'
import { allocateFifo, weightedAverageSnapshot, recordSale, type SaleLine } from '@/lib/record-sale'

describe('allocateFifo', () => {
  const base = (overrides: Partial<SaleLine> & { lineId: string; purchaseId: number }): SaleLine => ({
    productId: 1,
    effective_unit_cost: 0,
    remaining_quantity: 0,
    purchase_date: null,
    ...overrides,
  })

  it('consumes oldest lines first', () => {
    const lines = [
      base({ lineId: 'new', purchaseId: 2, effective_unit_cost: 30, remaining_quantity: 4, purchase_date: '2026-02-01' }),
      base({ lineId: 'old', purchaseId: 1, effective_unit_cost: 25, remaining_quantity: 6, purchase_date: '2026-01-01' }),
    ]
    const alloc = allocateFifo(lines, 8)
    expect(alloc).toEqual([
      { lineId: 'old', purchaseId: 1, quantity: 6, effective_unit_cost: 25 },
      { lineId: 'new', purchaseId: 2, quantity: 2, effective_unit_cost: 30 },
    ])
  })

  it('consumes partially when a line has more stock than needed', () => {
    const lines = [base({ lineId: 'l1', purchaseId: 1, effective_unit_cost: 25, remaining_quantity: 10 })]
    const alloc = allocateFifo(lines, 3)
    expect(alloc).toEqual([{ lineId: 'l1', purchaseId: 1, quantity: 3, effective_unit_cost: 25 }])
  })

  it('returns nothing for empty lines', () => {
    expect(allocateFifo([], 5)).toEqual([])
  })

  it('treats null purchase_date lines as last', () => {
    const lines = [
      base({ lineId: 'a', purchaseId: 1, effective_unit_cost: 25, remaining_quantity: 5, purchase_date: null }),
      base({ lineId: 'b', purchaseId: 2, effective_unit_cost: 20, remaining_quantity: 5, purchase_date: '2026-01-01' }),
    ]
    const alloc = allocateFifo(lines, 10)
    expect(alloc.map((a) => a.lineId)).toEqual(['b', 'a'])
  })
})

describe('weightedAverageSnapshot', () => {
  it('computes the weighted average of consumed quantities', () => {
    const avg = weightedAverageSnapshot([
      { lineId: 'a', purchaseId: 1, quantity: 6, effective_unit_cost: 25 },
      { lineId: 'b', purchaseId: 2, quantity: 2, effective_unit_cost: 30 },
    ])
    expect(avg).toBe(26.25)
  })

  it('returns 0 for no allocations', () => {
    expect(weightedAverageSnapshot([])).toBe(0)
  })
})

describe('recordSale', () => {
  function buildFixture() {
    const productsById = new Map<number, any>([
      [1, { id: 1, title: 'Test Box', cost_of_goods_sold: 0, quantity: 10 }],
      [2, { id: 2, title: 'Legacy Card', cost_of_goods_sold: 12.5, quantity: 3 }],
    ])
    const purchasesById = new Map<number, any>([
      [
        10,
        {
          id: 10,
          purchase_date: '2026-01-01',
          lines: [{ id: 'la1', product: 1, quantity: 6, unit_cost: 25, effective_unit_cost: 25, remaining_quantity: 6 }],
        },
      ],
      [
        11,
        {
          id: 11,
          purchase_date: '2026-02-01',
          lines: [{ id: 'lb1', product: 1, quantity: 4, unit_cost: 30, effective_unit_cost: 30, remaining_quantity: 4 }],
        },
      ],
    ])
    const calls = { create: [] as any[], update: [] as any[] }
    const payload: any = {
      find: async ({ collection }: any) => {
        if (collection === 'purchases') {
          return { docs: [...purchasesById.values()], totalPages: 1, totalDocs: purchasesById.size }
        }
        return { docs: [] }
      },
      findByID: async ({ collection, id }: any) => {
        if (collection === 'products') return productsById.get(Number(id))
        if (collection === 'purchases') return purchasesById.get(Number(id))
        return null
      },
      create: async ({ collection, data }: any) => {
        calls.create.push({ collection, data })
        return { id: 1, ...data }
      },
      update: async ({ collection, id, data }: any) => {
        calls.update.push({ collection, id, data })
        if (collection === 'products' && productsById.has(Number(id))) {
          productsById.set(Number(id), { ...productsById.get(Number(id)), ...data })
        }
        if (collection === 'purchases' && purchasesById.has(Number(id))) {
          purchasesById.set(Number(id), { ...purchasesById.get(Number(id)), ...data })
        }
        return data
      },
    }
    return { payload, calls, productsById, purchasesById }
  }

  it('creates the order with FIFO cost snapshot, decrements stock and consumes lines', async () => {
    const { payload, calls, productsById, purchasesById } = buildFixture()

    const result = await recordSale(payload, {
      transactionId: 'cs_test_123',
      channel: 'website',
      email: 'buyer@example.com',
      items: [{ productId: 1, quantity: 8, price: 60 }],
      value: 480,
      currency: 'EUR',
      shipping: 0,
    })

    const orderCreate = calls.create.find((c) => c.collection === 'orders')
    expect(orderCreate.data.transaction_id).toBe('cs_test_123')
    expect(orderCreate.data.sales_channel).toBe('website')
    expect(orderCreate.data.status).toBe('paid')
    expect(orderCreate.data.email).toBe('buyer@example.com')
    expect(orderCreate.data.items[0].unit_cost_snapshot).toBe(26.25)

    expect(productsById.get(1).quantity).toBe(2)

    const purchaseUpdates = calls.update.filter((c) => c.collection === 'purchases')
    const remainingByLine = new Map(
      purchaseUpdates.flatMap((u) => u.data.lines.map((l: any) => [l.id, l.remaining_quantity])),
    )
    expect(remainingByLine.get('la1')).toBe(0)
    expect(remainingByLine.get('lb1')).toBe(2)

    expect(result.items[0].unitCostSnapshot).toBe(26.25)
    expect(result.items[0].productTitle).toBe('Test Box')
  })

  it('falls back to product cost_of_goods_sold when no purchase lines exist', async () => {
    const { payload, calls, productsById } = buildFixture()

    await recordSale(payload, {
      transactionId: 'EXT-VINTED-1',
      channel: 'vinted',
      email: 'ext-vinted@darkcardcollection.com',
      items: [{ productId: 2, quantity: 1, price: 20 }],
      value: 20,
    })

    const orderCreate = calls.create.find((c) => c.collection === 'orders')
    expect(orderCreate.data.sales_channel).toBe('vinted')
    expect(orderCreate.data.items[0].unit_cost_snapshot).toBe(12.5)
    expect(productsById.get(2).quantity).toBe(2)
  })

  it('dedupes repeated product lines into a single order item', async () => {
    const { payload, calls } = buildFixture()

    await recordSale(payload, {
      transactionId: 'cs_multi',
      channel: 'website',
      email: 'x@example.com',
      items: [
        { productId: 1, quantity: 2, price: 60 },
        { productId: 1, quantity: 3, price: 60 },
      ],
      value: 300,
    })

    const orderCreate = calls.create.find((c) => c.collection === 'orders')
    expect(orderCreate.data.items).toHaveLength(1)
    expect(orderCreate.data.items[0].quantity).toBe(5)
  })
})
