import { getPayloadClient } from '@/lib/payload'
import { ListingShell } from '@/components/sections/ListingShell'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bestseller Pokémon TCG | I Più Venduti Sigillati',
  description:
    "I prodotti Pokémon TCG più venduti e più amati: booster box, ETB e collection box sigillati. Spedizione gratuita in Italia dagli 80 €.",
  alternates: {
    canonical: '/shop/bestsellers',
  },
}

export default async function BestsellersPage() {
  let products: any[] = []
  let categories: any[] = []
  let espansioni: any[] = []

  try {
    const payload = await getPayloadClient()

    const result = await payload.find({ overrideAccess: true, 
      collection: 'products',
      where: {
        and: [
          { status: { in: ['listed', 'hold', 'sold'] } },
          { is_visible: { equals: true } },
          { featured: { equals: true } },
        ],
      },
      limit: 50,
      sort: '-createdAt',
    })
    products = result.docs

    if (products.length === 0) {
      const fallback = await payload.find({ overrideAccess: true, 
        collection: 'products',
        where: {
          and: [
            { status: { in: ['listed', 'hold', 'sold'] } },
            { is_visible: { equals: true } },
          ],
        },
        limit: 50,
        sort: '-createdAt',
      })
      products = fallback.docs
    }

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
      title="Bestseller"
      subtitle="I prodotti più venduti e più amati dai nostri clienti"
      action="/shop/bestsellers"
      categories={categories}
      espansioni={espansioni}
      products={products}
    />
  )
}
