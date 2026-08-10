import { getPayloadClient } from '@/lib/payload'
import { ListingShell } from '@/components/sections/ListingShell'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Preordini Pokémon TCG | Le Prossime Espansioni',
  description:
    'Preordina le prossime espansioni Pokémon TCG: booster box, ETB e collection box prima dell\u2019uscita ufficiale. Spedizione gratuita in Italia dagli 80 €.',
  alternates: {
    canonical: '/shop/preorders',
  },
}

export default async function PreordersPage() {
  let products: any[] = []
  let categories: any[] = []
  let collections: any[] = []

  try {
    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'products',
      where: {
        AND: [{ is_preorder: { equals: true } }, { is_visible: { equals: true } }],
      },
      limit: 50,
      sort: '-createdAt',
    })
    products = result.docs

    const catResult = await payload.find({
      collection: 'categories',
      limit: 50,
      sort: 'name',
    })
    categories = catResult.docs

    const colResult = await payload.find({
      collection: 'collections',
      limit: 50,
      sort: 'name',
    })
    collections = colResult.docs
  } catch {
    // DB might not be connected during build
  }

  return (
    <ListingShell
      title="In Attesa"
      subtitle="Prodotti attualmente in hold, disponibili a breve"
      action="/shop/preorders"
      categories={categories}
      collections={collections}
      products={products}
    />
  )
}
