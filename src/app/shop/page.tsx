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

    const where: any = { AND: [{ status: { equals: 'listed' } }, { isVisible: { equals: true } }] }
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

  return (
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Shop</h1>

        <form action="/shop" method="GET" className="mb-8 space-y-3">
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Cerca per nome..."
            className="w-full border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#FACC15] focus:outline-none shadow-[3px_3px_0px_0px_#27272a]"
          />

          <div className="flex flex-wrap gap-3 items-center">
            <select
              name="condition"
              defaultValue={params.condition || ''}
              className="border-2 border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-[#FACC15] focus:outline-none shadow-[2px_2px_0px_0px_#27272a]"
            >
              <option value="">Tutte le condizioni</option>
              <option value="mint">Sigillato</option>
              <option value="near-mint">Near Mint</option>
              <option value="graded">Graded</option>
            </select>

            <select
              name="language"
              defaultValue={params.language || ''}
              className="border-2 border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-[#FACC15] focus:outline-none shadow-[2px_2px_0px_0px_#27272a]"
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
                className="border-2 border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-[#FACC15] focus:outline-none shadow-[2px_2px_0px_0px_#27272a]"
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
                className="border-2 border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-[#FACC15] focus:outline-none shadow-[2px_2px_0px_0px_#27272a]"
              >
                <option value="">Tutte le collezioni</option>
                {collections.map((col: any) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="border-2 border-[#FACC15] bg-[#FACC15] px-5 py-2.5 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-0 active:shadow-none"
            >
              Filtra
            </button>
          </div>
        </form>

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
