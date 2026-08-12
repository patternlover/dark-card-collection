import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import { groupProducts } from '@/lib/group-products'
import { Reveal } from '@/components/ui/Reveal'

export async function FeaturedProducts() {
  let products: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: {
        AND: [{ status: { in: ['listed', 'hold', 'sold'] } }, { is_visible: { equals: true } }],
      },
      limit: 100,
      sort: '-createdAt',
    })
    products = result.docs
  } catch {
    // DB might not be connected during build
  }

  const groups = groupProducts(products).slice(0, 4)

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Prodotti in Evidenza</h2>
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
            <p className="mt-2 text-sm text-zinc-600">Torna a trovarci a breve!</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group, i) => (
              <Reveal key={group.title} delay={i * 80} className="h-full">
                <ProductCard group={group} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
