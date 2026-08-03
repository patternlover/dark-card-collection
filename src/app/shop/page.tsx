import { getPayloadClient } from '@/lib/payload'
import { ProductGroupCard } from '@/components/product/ProductGroupCard'
import { ListingShell } from '@/components/sections/ListingShell'
import { groupProducts } from '@/lib/group-products'
import { applyListingFilters, type ListingParams } from '@/lib/product-filters'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Esplora il nostro catalogo di prodotti Pokémon TCG sigillati.',
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const listingParams: ListingParams = {
    q: params.q,
    category: params.category,
    collection: params.collection,
    condition: params.condition,
    language: params.language,
  }

  let products: any[] = []
  let categories: any[] = []
  let collections: any[] = []

  try {
    const payload = await getPayloadClient()

    const where = applyListingFilters(
      { AND: [{ status: { in: ['listed', 'hold'] } }, { isVisible: { equals: true } }] },
      listingParams,
    )

    const result = await payload.find({
      collection: 'products',
      where,
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
      title="Shop"
      action="/shop"
      searchDefault={listingParams.q || ''}
      categories={categories}
      collections={collections}
      params={listingParams}
    >
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-zinc-500">Nessun prodotto trovato.</p>
          <p className="mt-2 text-sm text-zinc-600">
            I prodotti vengono importati automaticamente dal foglio Google Sheets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {groupProducts(products).map((group) => (
            <ProductGroupCard key={group.title} group={group} />
          ))}
        </div>
      )}
    </ListingShell>
  )
}
