import { getPayloadClient } from '@/lib/payload'
import { ProductGroupCard } from '@/components/product/ProductGroupCard'
import { groupProducts } from '@/lib/group-products'

export async function FeaturedProducts() {
  let products: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { status: { equals: 'listed' } },
      limit: 8,
      sort: '-createdAt',
    })
    products = result.docs
  } catch {
    // DB might not be connected during build
  }

  const groups = groupProducts(products)

  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">In Evidenza</h2>
          <a
            href="/shop"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Vedi tutti →
          </a>
        </div>

        {groups.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-zinc-500">Nessun prodotto disponibile al momento.</p>
            <p className="mt-2 text-sm text-zinc-600">
              I prodotti verranno aggiunti automaticamente dal foglio Google Sheets.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <ProductGroupCard key={group.title} group={group} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
