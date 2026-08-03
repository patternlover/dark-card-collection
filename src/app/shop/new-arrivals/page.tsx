import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFiltersSidebar } from '@/components/product/ProductFiltersSidebar'
import { ProductSearchInput } from '@/components/product/ProductSearchInput'
import { applyListingFilters, type ListingParams } from '@/lib/product-filters'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Novità | Dark Card Collection',
  description: 'Scopri gli ultimi prodotti aggiunti al nostro catalogo.',
}

export default async function NewArrivalsPage({
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
        { AND: [{ status: { in: ['listed', 'hold'] } }, { isVisible: { equals: true } }] },
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
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-white">Novità</h1>
        <p className="mb-8 text-zinc-400">Scopri gli ultimi prodotti aggiunti al nostro catalogo</p>

        <form action="/shop/new-arrivals" method="GET">
          <div className="mb-6">
            <ProductSearchInput defaultValue={listingParams.q || ''} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
            <ProductFiltersSidebar
              action="/shop/new-arrivals"
              categories={categories}
              collections={collections}
              params={listingParams}
            />

            <section>
              {products.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-lg text-zinc-500">Stiamo preparando novità.</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Resta connesso per i prossimi arrivi!
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
