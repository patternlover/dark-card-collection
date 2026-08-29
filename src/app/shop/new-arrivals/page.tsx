import {
  listCatalogCategories,
  listCatalogCollections,
  listCatalogProducts,
  toCategoryRef,
  toCollectionRef,
} from '@/lib/medusa/products'
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
    products = await listCatalogProducts({ limit: 50 })

    const collections = await listCatalogCollections()
    espansioni = collections.slice(0, 50).map(toCollectionRef)
    const cats = await listCatalogCategories()
    categories = cats.slice(0, 50).map(toCategoryRef)
  } catch {
    // Medusa non raggiungibile
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
