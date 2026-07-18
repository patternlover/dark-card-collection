import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Novita | Dark Card Collection',
  description: 'Scopri gli ultimi prodotti aggiunti al nostro catalogo.',
}

export default async function NewArrivalsPage() {
  let products: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { status: { equals: 'listed' } },
      limit: 50,
      sort: '-createdAt',
    })
    products = result.docs
  } catch {
    // DB might not be connected during build
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-2">Novita</h1>
        <p className="text-zinc-400 mb-8">
          Scopri gli ultimi prodotti aggiunti al nostro catalogo
        </p>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">Stiamo preparando novita.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Resta connesso per i prossimi arrivi!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
