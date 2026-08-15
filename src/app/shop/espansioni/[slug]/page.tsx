import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { groupProducts } from '@/lib/group-products'
import { ProductCard } from '@/components/product/ProductCard'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const url = `${SITE_URL}/shop/espansioni/${slug}`
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({ overrideAccess: true, 
      collection: 'espansioni',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const col = result.docs[0]
    if (!col) return { title: 'Espansione non trovata' }
    return {
      title: `${col.name} | Booster Box, ETB e Collection Box`,
      description: col.description
        ? `${col.description} Scopri booster box, ETB e collection box di ${col.name}: originali e sigillati, spedizione gratuita in Italia dagli 80 €.`
        : `Booster Box, ETB e Collection Box dell'espansione ${col.name}: originali e sigillati, spedizione gratuita in Italia dagli 80 €.`,
      alternates: { canonical: url },
    }
  } catch {
    return { title: 'Espansione' }
  }
}

export default async function EspansionePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let espansione: any = null
  let products: any[] = []
  let otherEspansioni: any[] = []

  try {
    const payload = await getPayloadClient()
    const colResult = await payload.find({ overrideAccess: true, 
      collection: 'espansioni',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    espansione = colResult.docs[0]

    if (!espansione) notFound()

    const colId = typeof espansione === 'object' ? espansione.id : espansione
    const prodResult = await payload.find({ overrideAccess: true, 
      collection: 'products',
      where: {
        AND: [{ expansion: { equals: colId } }, { is_visible: { equals: true } }],
      },
      limit: 100,
      sort: '-createdAt',
    })
    products = prodResult.docs

    const otherResult = await payload.find({ overrideAccess: true, 
      collection: 'espansioni',
      where: { id: { not_equals: colId } },
      limit: 8,
      sort: 'name',
    })
    otherEspansioni = otherResult.docs
  } catch {
    notFound()
  }

  if (!espansione) notFound()

  const groups = groupProducts(products)
  const collectionUrl = `${SITE_URL}/shop/espansioni/${espansione.slug}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Espansioni',
        item: `${SITE_URL}/shop/espansioni`,
      },
      { '@type': 'ListItem', position: 4, name: espansione.name, item: collectionUrl },
    ],
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: groups.map((group, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: group.title,
      url: `${SITE_URL}/products/${group.slug}`,
    })),
  }

  return (
    <div className="bg-black">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: 'Espansioni', href: '/shop/espansioni' },
            { label: espansione.name },
          ]}
        />

        <Reveal>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            {espansione.name}
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            {espansione.description
              ? espansione.description
              : `Booster box, ETB, collection box e SPC dell'espansione ${espansione.name}: prodotti Pokémon TCG originali e sigillati.`}
          </p>
          {espansione.releaseDate && (
            <p className="mt-3 text-sm text-zinc-500">
              Data di uscita: {new Date(espansione.releaseDate).toLocaleDateString('it-IT')}
            </p>
          )}
        </Reveal>

        {groups.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-zinc-500">
              Nessun prodotto disponibile per questa espansione al momento.
            </p>
            <p className="mt-2 text-sm text-zinc-600">Torna a trovarci a breve!</p>
          </div>
        ) : (
          <>
            <h2 className="mt-10 text-xl font-bold uppercase tracking-tight text-white">
              Prodotti dell'espansione
            </h2>
            <Reveal>
              <div className="mt-6 columns-1 gap-6 sm:columns-2 xl:columns-3">
                {groups.map((group) => (
                  <div key={group.title} className="mb-6 break-inside-avoid">
                    <ProductCard group={group} />
                  </div>
                ))}
              </div>
            </Reveal>
          </>
        )}

        {otherEspansioni.length > 0 && (
          <section className="mt-16 border-t-2 border-zinc-800 pt-12">
            <h2 className="text-xl font-bold uppercase tracking-tight text-white">
              Altre espansioni
            </h2>
            <Reveal>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {otherEspansioni.map((col) => (
                  <Link
                    key={col.id}
                    href={`/shop/espansioni/${col.slug}`}
                    className="border-2 border-zinc-700 bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_#27272a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[5px_5px_0px_0px_var(--accent)]"
                  >
                    <h3 className="font-semibold text-white line-clamp-2">{col.name}</h3>
                    <p className="mt-2 text-xs text-[var(--accent)]">Vedi prodotti →</p>
                  </Link>
                ))}
              </div>
            </Reveal>
          </section>
        )}
      </div>
    </div>
  )
}
