import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'In Attesa | Dark Card Collection',
  description: 'Prodotti attualmente in hold — disponibili a breve.',
}

export default async function PreordersPage() {
  let products: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { status: { equals: 'hold' } },
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
        <h1 className="text-3xl font-bold text-white mb-2">In Attesa</h1>
        <p className="text-zinc-400 mb-8">
          Prodotti attualmente in hold — disponibili a breve
        </p>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">Nessun prodotto in attesa al momento.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Torna a trovarci per scoprire i prossimi arrivi!
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
