// Seed di dati "live-like" per riprodurre il #441 / toggle rotto:
// prodotti con tutti i campi, relazioni, stati misti, e un lotto consumato da FIFO.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { recordSale } from '../src/lib/record-sale'

async function main() {
  const payload = await getPayload({ config })

  const cat = await payload.create({ overrideAccess: true,  collection: 'categories', data: { name: 'Booster Box', slug: 'booster-box' } as any })
  const col = await payload.create({ overrideAccess: true,  collection: 'collections', data: { name: 'Scarlet & Violet', slug: 'sv' } as any })

  const base = [
    { title: 'Live Full Box', slug: 'live-full-box', price: 150, sale_price: 180, cost_of_goods_sold: 95, quantity: 5, featured: true, is_visible: true, category: cat.id, collection: col.id, product_type: 'booster-box', google_product_category: 'Toys & Games > Trading Card Game Cards', average_sale_price: 155, last_price_update: new Date().toISOString(), item_group_id: 'live-full-box', grade: 'mint', condition: 'new', availability: 'in_stock' },
    { title: 'Live Hidden', slug: 'live-hidden', price: 40, quantity: 2, is_visible: false, availability: 'in_stock' },
    { title: 'Live Preorder', slug: 'live-preorder', price: 90, quantity: 0, is_preorder: true, status: 'hold', availability: 'preorder' },
    { title: 'Live Sold', slug: 'live-sold', price: 25, quantity: 0, status: 'sold', availability: 'out_of_stock' },
    { title: 'Live No Price', slug: 'live-no-price', price: null, quantity: 3, status: 'listed' },
    { title: 'Live No Qty', slug: 'live-no-qty', price: 60, quantity: null, status: 'listed' },
  ]
  const ids: number[] = []
  for (const p of base) {
    const doc = await payload.create({ overrideAccess: true,  collection: 'products', data: p as any })
    ids.push(Number(doc.id))
  }

  const p = await payload.create({ overrideAccess: true, 
    collection: 'purchases',
    data: { purchase_date: new Date().toISOString().split('T')[0], source_type: 'online', source_name: 'Live Shop', lines: [{ product: ids[0], quantity: 5, unit_cost: 95 }] } as any,
  })
  console.log('purchase', p.id)

  await recordSale(payload, {
    transactionId: 'live-order-1',
    channel: 'website',
    email: 'live@test.it',
    items: [{ productId: ids[0], quantity: 1, price: 150 }],
    value: 150,
  })

  const prods = await payload.find({ overrideAccess: true,  collection: 'products', limit: 20, depth: 0 })
  console.log('Seeded live-like, products:', prods.totalDocs)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
