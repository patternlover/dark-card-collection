/**
 * Seed: aggiunge la categoria "Collezione" (item_category_3) se non esiste.
 *
 * Uso: pnpm exec tsx scripts/seed-collezione-category.ts
 */
import { getPayloadClient } from '../src/lib/payload'

async function main() {
  const payload = await getPayloadClient()

  const existing = await payload.find({
    overrideAccess: true,
    collection: 'categories',
    where: { slug: { equals: 'collezione' } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log('Categoria "Collezione" già presente (id:', existing.docs[0].id, ')')
    return
  }

  const doc = await payload.create({
    overrideAccess: true,
    collection: 'categories',
    data: {
      name: 'Collezione',
      slug: 'collezione',
      kind: 'product',
      description: 'Collezione di prodotti sigillati',
    },
  })

  console.log('Categoria "Collezione" creata (id:', doc.id, ')')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
