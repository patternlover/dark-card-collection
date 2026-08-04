import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Guide Pokémon TCG | Come Scegliere e Dove Comprare',
  description:
    'Guide pratiche sul Pokémon TCG: come riconoscere i prodotti originali, scegliere il booster box giusto e capire cosa sono le Elite Trainer Box. Spedizione gratuita dagli 80 €.',
  alternates: {
    canonical: '/guide',
  },
}

const guides = [
  {
    title: 'Dove comprare carte Pokémon originali',
    href: '/guide/dove-comprare-carte-pokemon-originali',
    description:
      'Come riconoscere un prodotto originale, quali canali sono affidabili e cosa controllare prima di pagare.',
  },
  {
    title: 'Come scegliere un booster box',
    href: '/guide/come-scegliere-booster-box',
    description:
      'Quante bustine contiene, come leggere il prezzo di mercato e come capire se conviene rispetto alle bustine singole.',
  },
  {
    title: 'ETB: cosa sono le Elite Trainer Box',
    href: '/guide/etb-cosa-sono-elite-trainer-box',
    description:
      'Cosa contiene una Elite Trainer Box, quanto costa e a chi conviene rispetto al booster box.',
  },
]

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Guide', item: `${SITE_URL}/guide` },
  ],
}

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: guides.map((g, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: g.title,
    url: `${SITE_URL}${g.href}`,
  })),
}

export default function GuideHubPage() {
  return (
    <div className="bg-black">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm font-medium uppercase tracking-wider">
          <ol className="flex flex-wrap items-center gap-x-2 text-zinc-500">
            <li>
              <Link href="/" className="transition-colors hover:text-[var(--accent)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300">Guide</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Guide Pokémon TCG
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Guide pratiche per collezionisti e principianti: dove comprare, come scegliere e cosa
          significa ogni prodotto. Tutto spiegato in modo semplice.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="rounded-lg border-2 border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-[var(--accent)]"
            >
              <h2 className="text-lg font-bold text-white">{guide.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{guide.description}</p>
              <p className="mt-4 text-sm text-[var(--accent)]">Leggi la guida →</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-bold text-white">Pronto a collezionare?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Scopri tutte le collezioni e i prodotti disponibili nel nostro shop.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="border-2 border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
            >
              Vai allo Shop
            </Link>
            <Link
              href="/shop/collections"
              className="border-2 border-zinc-600 px-5 py-2 text-sm font-black uppercase tracking-wide text-white transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Le Collezioni
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
