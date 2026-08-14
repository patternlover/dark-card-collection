import { getPayloadClient } from '@/lib/payload'
import { ListingShell } from '@/components/sections/ListingShell'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop Pokémon TCG | Booster Box, ETB e Sigillati',
  description:
    'Tutti i nostri prodotti Pokémon TCG sigillati: booster box, ETB, collection box e SPC. Originali al 100%, spedizione gratuita in Italia dagli 80 €.',
  alternates: {
    canonical: '/shop',
  },
}

export default async function ShopPage() {
  let products: any[] = []
  let espansioni: any[] = []

  try {
    const payload = await getPayloadClient()

    const result = await payload.find({ overrideAccess: true, 
      collection: 'products',
      where: {
        AND: [{ status: { in: ['listed', 'hold', 'sold'] } }, { is_visible: { equals: true } }],
      },
      limit: 50,
      sort: '-createdAt',
    })
    products = result.docs


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
      title="Shop Pokémon TCG"
      subtitle="Booster Box, ETB, Collection Box e SPC sigillati. Originali al 100%."
      action="/shop"
      espansioni={espansioni}
      products={products}
    />
  )
}
