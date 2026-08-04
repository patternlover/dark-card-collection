import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { formatCollectionName } from '@/lib/collections'

export async function CollectionsShowcase() {
  let collections: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'collections',
      limit: 4,
      sort: 'name',
    })
    collections = result.docs
  } catch {
    // DB might not be connected during build
  }

  if (collections.length === 0) return null

  return (
    <section className="border-t-2 border-zinc-800 bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Quali collezioni sono in vendita?
          </h2>
          <Link
            href="/shop/collections"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Tutte le collezioni →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/shop/collections/${col.slug}`}
              className="rounded-lg border-2 border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-[#FACC15]"
            >
              <h3 className="font-semibold text-white line-clamp-2">{formatCollectionName(col.name)}</h3>
              {col.releaseDate && (
                <p className="mt-1 text-xs text-zinc-500">
                  Uscita: {new Date(col.releaseDate).toLocaleDateString('it-IT')}
                </p>
              )}
              <p className="mt-3 text-xs text-[#FACC15]">Vedi prodotti →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
