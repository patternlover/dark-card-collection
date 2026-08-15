import { getPayloadClient } from '@/lib/payload'
import { ListingShell } from '@/components/sections/ListingShell'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Novità Pokémon TCG | Ultimi Arrivi Sigillati',
  description:
    'Scopri gli ultimi arrivi di Pokémon TCG sigillati: booster box, ETB e collection box appena aggiunti al catalogo. Spedizione gratuita dagli 80 €.',
  alternates: {
    canonical: '/shop/new-arrivals',
  },
}

export default async function NewArrivalsPage() {
  let products: any[] = []
  let categories: any[] = []
  let espansioni: any[] = []

  try {
    const payload = await getPayloadClient()

    const result = await payload.find({ overrideAccess: true, 
      collection: 'products',
      where: { is_visible: { equals: true } },
      limit: 50,
      sort: '-createdAt',
    })
    products = result.docs


    const catResult = await payload.find({ overrideAccess: true, 
      collection: 'categories',
      limit: 50,
      sort: 'name',
    })
    categories = catResult.docs

    const colResult = await payload.find({ overrideAccess: true, 
      collection: 'espansioni',
      limit: 50,
      sort: 'name',
    })
    espansioni = colResult.docs
  } catch {
    // DB might not be connected during build
  }

  return (
    <ListingShell
      title="Novità"
      subtitle="Scopri gli ultimi prodotti aggiunti al nostro catalogo"
      action="/shop/new-arrivals"
      categories={categories}
      espansioni={espansioni}
      products={products}
    />
  )
}
