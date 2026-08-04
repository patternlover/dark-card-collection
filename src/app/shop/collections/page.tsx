import { getPayloadClient } from '@/lib/payload'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Collezioni Pokémon TCG | Tutte le Espansioni',
  description:
    'Esplora tutte le collezioni Pokémon TCG in vendita: Primi Compagni d\u2019Avventura, Destino Sfuggente e molto altro. Originali e sigillati, spedizione gratuita dagli 80 €.',
  alternates: {
    canonical: '/shop/collections',
  },
}

export default async function CollectionsPage() {
  let collections: any[] = []

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'collections',
      limit: 50,
      sort: 'name',
    })
    collections = result.docs
  } catch {
    // DB might not be connected during build
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Collezioni',
        item: `${SITE_URL}/shop/collections`,
      },
    ],
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: collections.map((col, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: col.name,
      url: `${SITE_URL}/shop/collections/${col.slug}`,
    })),
  }

  return (
    <div className="bg-black">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm font-medium uppercase tracking-wider">
          <ol className="flex flex-wrap items-center gap-x-2 text-zinc-500">
            <li>
              <Link href="/" className="transition-colors hover:text-[var(--accent)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/shop" className="transition-colors hover:text-[var(--accent)]">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300">Collezioni</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Collezioni Pokémon TCG
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Tutte le espansioni Pokémon TCG in vendita da Dark Card Collection: booster box,
          ETB e collection box originali e sigillati. Ogni collezione ha la sua pagina
          dedicata con prezzi, disponibilità e dettagli.
        </p>

        {collections.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-zinc-500">Nessuna collezione disponibile.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Le collezioni verranno importate automaticamente dal foglio Google Sheets.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/shop/collections/${col.slug}`}
                className="rounded-lg border-2 border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-[var(--accent)]"
              >
                <div className="aspect-video rounded bg-zinc-800 mb-4 flex items-center justify-center">
                  <span className="text-3xl text-zinc-600">🃏</span>
                </div>
                <h2 className="text-lg font-semibold text-white">{col.name}</h2>
                {col.description && (
                  <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{col.description}</p>
                )}
                {col.releaseDate && (
                  <p className="mt-2 text-xs text-zinc-600">
                    Uscita: {new Date(col.releaseDate).toLocaleDateString('it-IT')}
                  </p>
                )}
                <p className="mt-4 text-sm text-[var(--accent)]">Vedi prodotti →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
