import { getPayloadClient } from '@/lib/payload'
import { ProductGroupCard } from '@/components/product/ProductGroupCard'
import { groupProducts } from '@/lib/group-products'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Esplora il nostro catalogo di prodotti Pokémon TCG sigillati.',
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; condition?: string; language?: string; collection?: string; q?: string }>
}) {
  const params = await searchParams

  let products: any[] = []
  let categories: any[] = []
  let collections: any[] = []

  try {
    const payload = await getPayloadClient()

    const where: any = { status: { equals: 'listed' } }
    if (params.category) {
      where.category = { equals: Number(params.category) || params.category }
    }
    if (params.collection) {
      where.collection = { equals: Number(params.collection) || params.collection }
    }
    if (params.condition) {
      where.condition = { equals: params.condition }
    }
    if (params.language) {
      where.language = { equals: params.language }
    }
    if (params.q) {
      where.title = { contains: params.q }
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

    const colResult = await payload.find({
      collection: 'collections',
      limit: 50,
      sort: 'name',
    })
    collections = colResult.docs
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

        <div className="space-y-4 mb-8">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Ricerca</h3>
            <form action="/shop" method="GET">
              {(params.category || params.collection || params.condition || params.language) && (
                <>
                  {params.category && <input type="hidden" name="category" value={params.category} />}
                  {params.collection && <input type="hidden" name="collection" value={params.collection} />}
                  {params.condition && <input type="hidden" name="condition" value={params.condition} />}
                  {params.language && <input type="hidden" name="language" value={params.language} />}
                </>
              )}
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Cerca per nome..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
            </form>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Condizione</h3>
            <div className="flex flex-wrap gap-2">
              <a href="/shop" className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!params.condition ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                Tutti
              </a>
              {conditionFilters.map((f) => (
                <a
                  key={f.id}
                  href={`/shop?condition=${f.id}${params.category ? `&category=${params.category}` : ''}${params.collection ? `&collection=${params.collection}` : ''}${params.language ? `&language=${params.language}` : ''}${params.q ? `&q=${params.q}` : ''}`}
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
                  href={`/shop?language=${f.id}${params.category ? `&category=${params.category}` : ''}${params.collection ? `&collection=${params.collection}` : ''}${params.condition ? `&condition=${params.condition}` : ''}${params.q ? `&q=${params.q}` : ''}`}
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
                <a href="/shop" className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!params.category ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  Tutti
                </a>
                {categories.map((cat: any) => (
                  <a
                    key={cat.id}
                    href={`/shop?category=${cat.id}${params.condition ? `&condition=${params.condition}` : ''}${params.collection ? `&collection=${params.collection}` : ''}${params.language ? `&language=${params.language}` : ''}${params.q ? `&q=${params.q}` : ''}`}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${params.category === String(cat.id) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          {collections.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Collezione</h3>
              <div className="flex flex-wrap gap-2">
                <a href="/shop" className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!params.collection ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  Tutti
                </a>
                {collections.map((col: any) => (
                  <a
                    key={col.id}
                    href={`/shop?collection=${col.id}${params.condition ? `&condition=${params.condition}` : ''}${params.language ? `&language=${params.language}` : ''}${params.category ? `&category=${params.category}` : ''}${params.q ? `&q=${params.q}` : ''}`}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${params.collection === String(col.id) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    {col.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">Nessun prodotto trovato.</p>
            <p className="mt-2 text-sm text-zinc-600">
              I prodotti vengono importati automaticamente dal foglio Google Sheets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groupProducts(products).map((group) => (
              <ProductGroupCard key={group.title} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
