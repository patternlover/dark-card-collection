// Setup del DB locale di test per gli E2E dashboard.
// Uso: node --env-file=.env.test node_modules/.bin/tsx scripts/test-db-setup.ts
// 1) inizializza Payload (l'adapter push:true crea lo schema) 2) resetta 3) seed baseline.
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function clearCollection(payload: Awaited<ReturnType<typeof getPayload>>, slug: string) {
  const { docs } = await payload.find({ overrideAccess: true,  collection: slug as any, limit: 1000, depth: 0 })
  for (const doc of docs) {
    await payload.delete({ overrideAccess: true,  collection: slug as any, id: doc.id })
  }
  console.log(`  cleared ${slug}: ${docs.length}`)
}

async function main() {
  const payload = await getPayload({ config })
  console.log('Payload initialized (schema pushed)')

  console.log('Resetting test collections...')
  // ordine per rispettare le FK (prima i figli che referenziano i prodotti)
  for (const slug of ['orders', 'messages', 'purchases', 'products', 'categories', 'espansioni'] as const) {
    await clearCollection(payload, slug)
  }

  console.log('Seeding baseline...')
  const collection = await payload.create({ overrideAccess: true, 
    collection: 'espansioni',
    data: { name: 'Test Set', slug: 'test-set', description: 'Collezione di test' } as any,
  })
  const microNames = [
    ['Spc', 'spc'],
    ['Box', 'box'],
    ['Bundle', 'bundle'],
    ['Etb', 'etb'],
    ['Tin', 'tin'],
    ['Singola', 'single'],
    ['Slab', 'slab'],
    ['Altro', 'other'],
  ]
  for (const [name, slug] of microNames) {
    await payload.create({ overrideAccess: true,  collection: 'categories', data: { name, slug } as any })
  }

  const product1 = await payload.create({ overrideAccess: true, 
    collection: 'products',
    data: {
      title: 'Test Booster Box',
      slug: 'test-booster-box',
      price: 120,
      cost_of_goods_sold: 80,
      quantity: 5,
      status: 'listed',
      grade: 'mint',
      condition: 'new',
      product_type: 'booster-box',
      collection: collection.id,
    } as any,
  })
  await payload.create({ overrideAccess: true, 
    collection: 'products',
    data: {
      title: 'Test ETB',
      slug: 'test-etb',
      price: 60,
      quantity: 3,
      status: 'listed',
      grade: 'near-mint',
      condition: 'new',
    } as any,
  })

  await payload.create({ overrideAccess: true, 
    collection: 'purchases',
    data: {
      purchase_date: new Date().toISOString().split('T')[0],
      source_type: 'shop',
      source_name: 'Test Shop',
      lines: [{ product: product1.id, quantity: 5, unit_cost: 80 }],
    } as any,
  })

  await payload.create({ overrideAccess: true, 
    collection: 'orders',
    data: {
      transaction_id: 'test-order-1',
      sales_channel: 'website',
      status: 'paid',
      email: 'buyer@test.it',
      value: 600,
      currency: 'EUR',
      items: [{ product: product1.id, quantity: 5, price: 120, unit_cost_snapshot: 80 }],
    } as any,
  })

  await payload.create({ overrideAccess: true, 
    collection: 'messages',
    data: { name: 'Test User', email: 'test@example.com', subject: 'Messaggio di test', message: 'Ciao!' } as any,
  })

  const prods = await payload.find({ overrideAccess: true,  collection: 'products', limit: 10, depth: 0 })
  console.log(`Seeded. Products: ${prods.totalDocs}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
