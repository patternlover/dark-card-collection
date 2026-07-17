import { getPayload } from 'payload'
import config from '@/payload.config'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFilters } from '@/components/product/ProductFilters'

export const dynamic = 'force-dynamic'

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; condition?: string; language?: string }>
}) {
  const params = await searchParams

  let products: any[] = []
  let categories: any[] = []

  try {
    const payload = await getPayload({ config })

    const where: any = { status: { equals: 'listed' } }
    if (params.category) {
      where.category = { equals: params.category }
    }
    if (params.condition) {
      where.condition = { equals: params.condition }
    }
    if (params.language) {
      where.language = { equals: params.language }
    }

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
  } catch {
    // DB might not be connected during build
  }

  const conditionFilters = [
    { id: 'mint', label: 'Sigillato' },
    { id: 'near-mint', label: 'Near Mint' },
    { id: 'graded', label: 'Graded' },
  ]

  const languageFilters = [
    { id: 'italian', label: 'Italiano' },
    { id: 'english', label: 'Inglese' },
    { id: 'chinese', label: 'Cinese' },
  ]

  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Shop</h1>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Condizione</h3>
            <div className="flex flex-wrap gap-2">
              <a href="/shop" className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!params.condition ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                Tutti
              </a>
              {conditionFilters.map((f) => (
                <a
                  key={f.id}
                  href={`/shop?condition=${f.id}${params.category ? `&category=${params.category}` : ''}${params.language ? `&language=${params.language}` : ''}`}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${params.condition === f.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                >
                  {f.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Lingua</h3>
            <div className="flex flex-wrap gap-2">
              <a href="/shop" className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!params.language ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                Tutti
              </a>
              {languageFilters.map((f) => (
                <a
                  key={f.id}
                  href={`/shop?language=${f.id}${params.category ? `&category=${params.category}` : ''}${params.condition ? `&condition=${params.condition}` : ''}`}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${params.language === f.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                >
                  {f.label}
                </a>
              ))}
            </div>
          </div>
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Categoria</h3>
              <div className="flex flex-wrap gap-2">
                <a href={`/shop${params.condition ? `?condition=${params.condition}` : ''}${params.language ? `?language=${params.language}` : ''}`} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!params.category ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  Tutti
                </a>
                {categories.map((cat: any) => (
                  <a
                    key={cat.id}
                    href={`/shop?category=${cat.id}${params.condition ? `&condition=${params.condition}` : ''}${params.language ? `&language=${params.language}` : ''}`}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${params.category === String(cat.id) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">Nessun prodotto trovato.</p>
            <p className="mt-2 text-sm text-zinc-600">
              I prodotti vengono importati automaticamente dal foglio Google Sheets.
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
