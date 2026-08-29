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
    const all = await listCatalogProducts({ limit: 50 })
    products = all.filter((p) => p.featured)
    if (products.length === 0) products = all

    const collections = await listCatalogCollections()
    espansioni = collections.slice(0, 50).map(toCollectionRef)
    const cats = await listCatalogCategories()
    categories = cats.slice(0, 50).map(toCategoryRef)
  } catch {
    // Medusa non raggiungibile
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