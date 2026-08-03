import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFiltersSidebar } from '@/components/product/ProductFiltersSidebar'
import { ProductSearchInput } from '@/components/product/ProductSearchInput'
import { applyListingFilters, type ListingParams } from '@/lib/product-filters'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bestseller | Dark Card Collection',
  description: "I prodotti più venduti e più amati dai nostri clienti.",
}

export default async function BestsellersPage({
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
        { status: { equals: 'listed' }, featured: { equals: true } },
        listingParams,
      ),
      limit: 50,
      sort: '-createdAt',
    })
    products = result.docs

    if (products.length === 0) {
      const fallback = await payload.find({
        collection: 'products',
        where: applyListingFilters({ status: { equals: 'listed' } }, listingParams),
        limit: 50,
        sort: '-createdAt',
      })
      products = fallback.docs
    }

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
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-white">Bestseller</h1>
        <p className="mb-8 text-zinc-400">I prodotti più venduti e più amati dai nostri clienti</p>

        <form action="/shop/bestsellers" method="GET">
          <div className="mb-6">
            <ProductSearchInput defaultValue={listingParams.q || ''} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
            <ProductFiltersSidebar
              action="/shop/bestsellers"
              categories={categories}
              collections={collections}
              params={listingParams}
            />

            <section>
              {products.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-lg text-zinc-500">Nessun bestseller al momento.</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    I prodotti verranno segnati come bestseller in base alle vendite.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </form>
      </div>
    </div>
  )
}
