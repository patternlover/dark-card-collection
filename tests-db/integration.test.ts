/**
 * Test di integrazione DB (Payload su dcc_test).
 * Eseguire con: pnpm test:db
 * (richiede Postgres locale: postgresql://edoardocavalcanti@localhost:5432/dcc_test,
 *  come da playwright.config.ts)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { recordSale } from '../src/lib/record-sale'
import { applyStockDelta, purchaseStockDelta } from '../src/lib/inventory'
import type { Payload } from 'payload'

let payload: Payload

async function clearCollections() {
  for (const slug of ['orders', 'messages', 'purchases', 'products', 'categories', 'espansioni'] as const) {
    const { docs } = await payload.find({ overrideAccess: true, collection: slug as any, limit: 1000, depth: 0 })
    for (const doc of docs) {
      await payload.delete({ overrideAccess: true, collection: slug as any, id: doc.id })
    }
  }
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await clearCollections()
})

afterAll(async () => {
  await clearCollections()
  if (typeof (payload as any)?.destroy === 'function') await (payload as any).destroy()
})

describe('DB integration: purchase -> sale pipeline', () => {
  it('creates a product, a purchase with stock, then records a sale (FIFO + margin + username)', async () => {
    // 1) create product (via lot quick-create equivalent)
    const product = await payload.create({
      overrideAccess: true,
      collection: 'products',
      data: {
        title: 'Integration Box',
        slug: 'integration-box',
        price: 50,
        quantity: 0,
        status: 'listed',
        is_visible: true,
        item_category_1: 'product',
        condition: 'new',
      } as any,
    })
    expect(product.id).toBeTruthy()

    // 2) purchase with two lines (FIFO order: older cost 20, newer cost 30)
    const purchase = await payload.create({
      overrideAccess: true,
      collection: 'purchases',
      data: {
        purchase_date: '2026-01-01',
        source_type: 'shop',
        source_name: 'Integration Shop',
        lines: [
          { product: product.id, quantity: 3, unit_cost: 20 },
          { product: product.id, quantity: 2, unit_cost: 30 },
        ],
      } as any,
    })
    expect(purchase.id).toBeTruthy()
    await applyStockDelta(payload, purchaseStockDelta((purchase as any).lines))

    // stock should be 5
    const stocked = await payload.findByID({ overrideAccess: true, collection: 'products', id: product.id, depth: 0 })
    expect(Number((stocked as any).quantity)).toBe(5)

    // 3) record a sale of 2 via recordSale (website channel, with username)
    const result = await recordSale(payload, {
      transactionId: 'INT-TEST-1',
      channel: 'website',
      email: 'buyer@test.it',
      customerUsername: 'buyer_user',
      items: [{ productId: Number(product.id), quantity: 2, price: 50 }],
      value: 100,
      currency: 'EUR',
    })
    expect(result.orderId).toBeTruthy()

    // order persisted with username + snapshot
    const order = await payload.findByID({ overrideAccess: true, collection: 'orders', id: result.orderId, depth: 0 })
    expect((order as any).customer_username).toBe('buyer_user')
    expect((order as any).sales_channel).toBe('website')
    const item = (order as any).items?.[0]
    expect(Number(item?.quantity)).toBe(2)
    // FIFO: 2 units consumed from the €20 line -> snapshot 20
    expect(Number(item?.unit_cost_snapshot)).toBe(20)

    // stock scaled to 3
    const after = await payload.findByID({ overrideAccess: true, collection: 'products', id: product.id, depth: 0 })
    expect(Number((after as any).quantity)).toBe(3)

    // purchase lines consumed FIFO: first line remaining 1, second 2
    const purAfter = await payload.findByID({ overrideAccess: true, collection: 'purchases', id: purchase.id, depth: 0 })
    const lines = (purAfter as any).lines ?? []
    expect(Number(lines[0]?.remaining_quantity)).toBe(1)
    expect(Number(lines[1]?.remaining_quantity)).toBe(2)
  })

  it('external channel sale (vinted) stores username and value', async () => {
    const product = await payload.create({
      overrideAccess: true,
      collection: 'products',
      data: {
        title: 'Integration Vinted Box',
        slug: 'integration-vinted-box',
        price: 40,
        quantity: 1,
        status: 'listed',
        is_visible: true,
        item_category_1: 'product',
      } as any,
    })
    const purchase = await payload.create({
      overrideAccess: true,
      collection: 'purchases',
      data: {
        purchase_date: '2026-02-01',
        source_type: 'online',
        source_name: 'Vinted Test',
        lines: [{ product: product.id, quantity: 1, unit_cost: 25 }],
      } as any,
    })
    await applyStockDelta(payload, purchaseStockDelta((purchase as any).lines))

    const result = await recordSale(payload, {
      transactionId: 'INT-VINTED-1',
      channel: 'vinted',
      email: 'vinted@test.it',
      customerUsername: 'vinted_user',
      items: [{ productId: Number(product.id), quantity: 1, price: 40 }],
      value: 40,
      currency: 'EUR',
    })
    const order = await payload.findByID({ overrideAccess: true, collection: 'orders', id: result.orderId, depth: 0 })
    expect((order as any).sales_channel).toBe('vinted')
    expect((order as any).customer_username).toBe('vinted_user')
    expect(Number((order as any).value)).toBe(40)
  })
})
