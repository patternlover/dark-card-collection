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

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (overrides.condition ?? params.condition) p.set('condition', overrides.condition ?? params.condition!)
    if (overrides.language ?? params.language) p.set('language', overrides.language ?? params.language!)
    if (overrides.category ?? params.category) p.set('category', overrides.category ?? params.category!)
    if (overrides.collection ?? params.collection) p.set('collection', overrides.collection ?? params.collection!)
    if (overrides.q ?? params.q) p.set('q', overrides.q ?? params.q!)
    const qs = p.toString()
    return qs ? `/shop?${qs}` : '/shop'
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-6">Shop</h1>

        <form action="/shop" method="GET" className="flex flex-wrap gap-3 items-center mb-8">
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Cerca per nome..."
            className="flex-1 min-w-[180px] rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
          />

          <select
            name="condition"
            defaultValue={params.condition || ''}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="">Tutte le condizioni</option>
            <option value="mint">Sigillato</option>
            <option value="near-mint">Near Mint</option>
            <option value="graded">Graded</option>
          </select>

          <select
            name="language"
            defaultValue={params.language || ''}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="">Tutte le lingue</option>
            <option value="italian">Italiano</option>
            <option value="english">Inglese</option>
            <option value="chinese">Cinese</option>
          </select>

          {categories.length > 0 && (
            <select
              name="category"
              defaultValue={params.category || ''}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-white focus:outline-none"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}

          {collections.length > 0 && (
            <select
              name="collection"
              defaultValue={params.collection || ''}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-white focus:outline-none"
            >
              <option value="">Tutte le collezioni</option>
              {collections.map((col: any) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="rounded-lg bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Filtra
          </button>
        </form>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">Nessun prodotto trovato.</p>
            <p className="mt-2 text-sm text-zinc-600">
              I prodotti vengono importati automaticamente dal foglio Google Sheets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groupProducts(products).map((group) => (
              <ProductGroupCard key={group.title} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
