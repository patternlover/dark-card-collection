import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { formatCollectionName } from '@/lib/collections'
import { Reveal } from '@/components/ui/Reveal'

export async function EspansionsShowcase() {
  let espansioni: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({ overrideAccess: true, 
      collection: 'espansioni',
      limit: 4,
      sort: 'name',
    })
    espansioni = result.docs
  } catch {
    // DB might not be connected during build
  }

  if (espansioni.length === 0) return null

  return (
    <section className="border-t-2 border-zinc-800 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Espansioni in Evidenza
          </h2>
          <Link
            href="/shop/espansioni"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Tutte le collezioni →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {espansioni.map((col, i) => (
            <Reveal key={col.id} delay={i * 70} className="h-full">
              <Link
                href={`/shop/espansioni/${col.slug}`}
                className="flex h-full flex-col border-2 border-zinc-700 bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_#27272a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[5px_5px_0px_0px_var(--accent)]"
              >
                <h3 className="font-semibold text-white line-clamp-2">{formatCollectionName(col.name)}</h3>
                {col.releaseDate && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Uscita: {new Date(col.releaseDate).toLocaleDateString('it-IT')}
                  </p>
                )}
                <p className="mt-auto pt-3 text-xs text-[var(--accent)]">Vedi prodotti →</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
