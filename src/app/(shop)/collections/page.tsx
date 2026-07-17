import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'

export default async function CollectionsPage() {
  let collections: any[] = []

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'collections',
      limit: 50,
      sort: 'name',
    })
    collections = result.docs
  } catch {
    // DB might not be connected during build
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-4">Collezioni</h1>
        <p className="text-zinc-400 mb-8">
          Esplora le nostre collezioni di espansioni Pokémon TCG
        </p>

        {collections.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500">Nessuna collezione disponibile.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Le collezioni verranno importate automaticamente dal foglio Google Sheets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/shop?collection=${col.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="aspect-video bg-zinc-800 rounded mb-4 flex items-center justify-center">
                  <span className="text-zinc-600 text-3xl">🃏</span>
                </div>
                <h2 className="text-lg font-semibold text-white">{col.name}</h2>
                {col.description && (
                  <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{col.description}</p>
                )}
                {col.releaseDate && (
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(col.releaseDate).toLocaleDateString('it-IT')}
                  </p>
                )}
                <p className="text-sm text-zinc-400 mt-4">Vedi prodotti →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
