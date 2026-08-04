import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { groupProducts } from '@/lib/group-products'
import { ProductGroupCard } from '@/components/product/ProductGroupCard'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

const CATEGORY_HINTS: Record<string, { title: string; description: string }> = {
  'booster-box': {
    title: 'Booster Box Pokémon',
    description:
      'Booster Box Pokémon TCG sigillate: 36 bustine per box. Scegli tra le espansioni più recenti e i classici introvabili, tutte originali e sigillate.',
  },
  etb: {
    title: 'ETB Pokémon (Elite Trainer Box)',
    description:
      'Elite Trainer Box Pokémon TCG: bustine, carte promozionali, dadi e segna-danni. Il kit perfetto per allenatori e collezionisti, sigillato e originale.',
  },
  'collection-box': {
    title: 'Collection Box Pokémon',
    description:
      'Collection Box Pokémon TCG con bustine, carte promozionali e contenuti esclusivi. Originali e sigillate, spedizione gratuita in Italia dagli 80 €.',
  },
  booster: {
    title: 'Bustine Pokémon',
    description:
      'Bustine singole e blister Pokémon TCG sigillati delle ultime espansioni. Originali al 100%, disponibili subito.',
  },
  spc: {
    title: 'Super Premium Collection Pokémon',
    description:
      'Super Premium Collection Pokémon TCG: il massimo per i collezionisti, con bustine, carte esclusive e contenuti premium. Sigillata e originale.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const url = `${SITE_URL}/shop/categories/${slug}`
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const cat = result.docs[0]
    if (!cat) return { title: 'Categoria non trovata' }

    const hint = CATEGORY_HINTS[slug]
    return {
      title: hint?.title || `${cat.name} Pokémon TCG`,
      description: hint?.description || cat.description || `${cat.name} Pokémon TCG in vendita: originali e sigillati, spedizione gratuita in Italia dagli 80 €.`,
      alternates: { canonical: url },
    }
  } catch {
    return { title: 'Categoria' }
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let category: any = null
  let products: any[] = []
  let otherCategories: any[] = []

  try {
    const payload = await getPayloadClient()
    const catResult = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    category = catResult.docs[0]

    if (!category) notFound()

    const catId = typeof category === 'object' ? category.id : category
    const prodResult = await payload.find({
      collection: 'products',
      where: {
        AND: [
          { category: { equals: catId } },
          { status: { in: ['listed', 'hold'] } },
          { isVisible: { equals: true } },
        ],
      },
      limit: 100,
      sort: '-createdAt',
    })
    products = prodResult.docs

    const otherResult = await payload.find({
      collection: 'categories',
      where: { id: { not_equals: catId } },
      limit: 8,
      sort: 'name',
    })
    otherCategories = otherResult.docs
  } catch {
    notFound()
  }

  if (!category) notFound()

  const groups = groupProducts(products)
  const categoryUrl = `${SITE_URL}/shop/categories/${category.slug}`
  const hint = CATEGORY_HINTS[slug]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
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
            <li className="text-zinc-300">{category.name}</li>
          </ol>
        </nav>

        <Reveal>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            {hint?.title || category.name}
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            {hint?.description || category.description || `${category.name} Pokémon TCG in vendita: originali e sigillati.`}
          </p>
        </Reveal>

        {groups.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-zinc-500">
              Nessun prodotto disponibile in questa categoria al momento.
            </p>
            <p className="mt-2 text-sm text-zinc-600">Torna a trovarci a breve!</p>
          </div>
        ) : (
          <>
            <h2 className="mt-10 text-xl font-bold uppercase tracking-tight text-white">
              Prodotti disponibili
            </h2>
            <Reveal>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {groups.map((group) => (
                  <ProductGroupCard key={group.title} group={group} />
                ))}
              </div>
            </Reveal>
          </>
        )}

        {otherCategories.length > 0 && (
          <section className="mt-16 border-t-2 border-zinc-800 pt-12">
            <h2 className="text-xl font-bold uppercase tracking-tight text-white">
              Altre categorie
            </h2>
            <Reveal>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {otherCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop/categories/${cat.slug}`}
                    className="border-2 border-zinc-700 bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_#27272a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[5px_5px_0px_0px_var(--accent)]"
                  >
                    <h3 className="font-semibold text-white line-clamp-2">{cat.name}</h3>
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
