import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import { ListingShell } from '@/components/sections/ListingShell'
import { applyListingFilters, type ListingParams } from '@/lib/product-filters'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'In Attesa | Dark Card Collection',
  description: 'Prodotti attualmente in hold, disponibili a breve.',
}

export default async function PreordersPage({
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

    const result = await payload.find({
      collection: 'products',
      where: applyListingFilters(
        { AND: [{ isPreorder: { equals: true } }, { isVisible: { equals: true } }] },
        listingParams,
      ),
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
      searchDefault={listingParams.q || ''}
      categories={categories}
      collections={collections}
      params={listingParams}
    >
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-zinc-500">Nessun prodotto in attesa al momento.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Torna a trovarci per scoprire i prossimi arrivi!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </ListingShell>
  )
}
