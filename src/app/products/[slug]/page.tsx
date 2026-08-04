import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { groupProducts } from '@/lib/group-products'
import { Badge } from '@/components/ui/Badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductImage } from '@/components/product/ProductImage'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { Truck, Shield, Package } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${SITE_URL}${url}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const url = `${SITE_URL}/products/${slug}`
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const product = result.docs[0]
    if (!product) return { title: 'Prodotto non trovato' }

    const price =
      product.storePrice && product.storePrice > 0 ? `€${product.storePrice.toFixed(2)}` : ''
    const collectionName =
      typeof product.collection === 'object' && product.collection?.name
        ? product.collection.name
        : ''

    const title = collectionName
      ? `${product.title}${price ? ` | ${price}` : ''} | ${collectionName}`
      : `${product.title}${price ? ` | ${price}` : ''}`

    const description =
      product.description && product.description.length > 5
        ? `${product.description.slice(0, 130)}. Spedizione gratuita in Italia dagli 80 €.`
        : `${product.title} in vendita presso Dark Card Collection: originale e sigillato, spedizione gratuita in Italia dagli 80 €.`

    const firstImage = product.images?.[0]?.image
    const imageUrl = absoluteUrl(
      product.imageUrl || (firstImage && typeof firstImage === 'object' ? firstImage.url : null),
    )

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: 'website',
        url,
        images: imageUrl
          ? [{ url: imageUrl, alt: product.title }]
          : [{ url: '/og.png', width: 1200, height: 630, alt: 'Dark Card Collection' }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : ['/og.png'],
      },
    }
  } catch {
    return {
      title: productNotFoundTitle(),
      alternates: { canonical: url },
    }
  }
}

function productNotFoundTitle() {
  return 'Prodotto'
}

const LANGUAGE_LABELS: Record<string, string> = {
  italian: 'Italiano',
  english: 'Inglese',
  chinese: 'Cinese',
  japanese: 'Giapponese',
}

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Sigillato',
  'near-mint': 'Near Mint',
  'lightly-played': 'Lightly Played',
  'moderately-played': 'Moderately Played',
  'heavily-played': 'Heavily Played',
  damaged: 'Damaged',
  graded: 'Graded',
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let product: any = null
  let group: any = null
  let relatedGroups: any[] = []

  try {
    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (result.docs.length === 0) {
      notFound()
    }

    product = result.docs[0]

    const allVariants = await payload.find({
      collection: 'products',
      where: { title: { equals: product.title } },
      limit: 100,
    })

    const groups = groupProducts(allVariants.docs)
    group = groups[0] || null

    if (product?.collection) {
      const colId = typeof product.collection === 'object' ? product.collection.id : product.collection
      const related = await payload.find({
        collection: 'products',
        where: {
          and: [
            { collection: { equals: colId } },
            { id: { not_equals: product.id } },
            { status: { equals: 'listed' } },
          ],
        },
        limit: 50,
      })
      relatedGroups = groupProducts(related.docs)
    }
  } catch {
    notFound()
  }

  if (!product || !group) notFound()

  const displayPrice = product.storePrice || 0

  const statusLabels: Record<string, string> = {
    listed: 'Disponibile',
    hold: 'In Attesa',
    sold: 'Venduto',
  }

  const collectionName = product.collection
    ? typeof product.collection === 'object'
      ? product.collection.name
      : product.collection
    : ''

  const collectionSlug =
    typeof product.collection === 'object' && product.collection?.slug
      ? product.collection.slug
      : ''

  const categoryName = product.category
    ? typeof product.category === 'object'
      ? product.category.name
      : product.category
    : ''

  const categorySlug =
    typeof product.category === 'object' && product.category?.slug
      ? product.category.slug
      : ''

  const availableLanguages = [...new Set(
    group.products
      .filter((p: any) => p.status === 'listed' && p.language)
      .map((p: any) => LANGUAGE_LABELS[p.language] || p.language)
  )]

  const availableConditions = [...new Set(
    group.products
      .filter((p: any) => p.status === 'listed' && p.condition)
      .map((p: any) => CONDITION_LABELS[p.condition] || p.condition)
  )]

  const imgSrc = group.imagePdp || group.image

  const buyableProduct =
    group.products.find(
      (p: any) => (p.status === 'listed' || p.status === 'hold') && p.storePrice && p.storePrice > 0,
    ) || product

  const badges = (
    <div className="flex flex-wrap gap-2">
      {product.condition === 'mint' && <Badge variant="new">Sigillato</Badge>}
      {product.condition === 'graded' && <Badge variant="bestseller">Graded</Badge>}
      {(product.isPreorder || product.status === 'hold') && <Badge variant="preorder">In Attesa</Badge>}
      <Badge variant="default">
        {statusLabels[product.status] || product.status}
      </Badge>
    </div>
  )

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="text-sm font-medium uppercase tracking-wider">
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
        <li>
          <Link href="/shop/collections" className="transition-colors hover:text-[var(--accent)]">
            Collezioni
          </Link>
        </li>
        {collectionName && (
          <>
            <li aria-hidden="true">/</li>
            <li>
              {collectionSlug ? (
                <Link
                  href={`/shop/collections/${collectionSlug}`}
                  className="transition-colors hover:text-[var(--accent)]"
                >
                  {collectionName}
                </Link>
              ) : (
                <span className="text-zinc-300">{collectionName}</span>
              )}
            </li>
          </>
        )}
      </ol>
    </nav>
  )

  const productUrl = `${SITE_URL}/products/${product.slug}`
  const availability =
    product.status === 'sold'
      ? 'https://schema.org/OutOfStock'
      : product.status === 'hold' || product.isPreorder
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/InStock'
  const schemaImageUrl = absoluteUrl(group.imagePdp || group.image)
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
        { '@type': 'ListItem', position: 3, name: 'Collezioni', item: `${SITE_URL}/shop/collections` },
        ...(collectionSlug
          ? [
              {
                '@type': 'ListItem' as const,
                position: 4,
                name: collectionName,
                item: `${SITE_URL}/shop/collections/${collectionSlug}`,
              },
            ]
          : []),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      name: product.title,
      ...(schemaImageUrl ? { image: [schemaImageUrl] } : {}),
      description: product.description || `${product.title} - Dark Card Collection`,
      ...(product.itemId ? { sku: product.itemId } : {}),
      offers: {
        '@type': 'Offer',
        '@id': `${productUrl}#offer`,
        url: productUrl,
        priceCurrency: 'EUR',
        price: displayPrice > 0 ? displayPrice.toFixed(2) : '0',
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        priceValidUntil,
        seller: { '@type': 'Organization', name: 'Dark Card Collection', url: SITE_URL },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: '9.99',
            eligibleTransactionVolume: {
              '@type': 'PriceSpecification',
              price: '80.00',
              priceCurrency: 'EUR',
            },
          },
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IT' },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 1,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 2,
              maxValue: 4,
              unitCode: 'DAY',
            },
          },
        },
      },
      merchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IT',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      },
    },
  ]

  return (
    <div className="bg-black">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-6 lg:hidden">
            {badges}
            {breadcrumb}
          </div>

          <div className="relative aspect-square w-full">
            {imgSrc ? (
              <ProductImage
                src={imgSrc}
                alt={product.title}
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="border-2 border-zinc-700 object-cover shadow-[4px_4px_0px_0px_#27272a]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center border-2 border-zinc-700 bg-zinc-800 shadow-[4px_4px_0px_0px_#27272a]">
                <span className="text-6xl text-zinc-600">📦</span>
              </div>
            )}
          </div>

          <Reveal>
            <div className="space-y-6">
              <div className="hidden lg:block">{badges}</div>
              <div className="hidden lg:block">{breadcrumb}</div>

            <h1 className="text-3xl font-black text-white uppercase tracking-tight">{product.title}</h1>

            {product.description && (
              <p className="text-base text-zinc-400 leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-[var(--accent)]">
                {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : 'Prezzo in arrivo'}
              </span>
              {product.compareAtPrice && product.compareAtPrice > displayPrice && (
                <span className="text-lg font-medium text-zinc-500 line-through">
                  €{product.compareAtPrice.toFixed(2)}
                </span>
              )}
              {group.totalQuantity > 0 && (
                <span className="text-sm text-zinc-500 font-medium">
                  {group.totalQuantity} disponibil{group.totalQuantity === 1 ? 'e' : 'i'}
                </span>
              )}
            </div>

            {availableLanguages.length > 0 && (
              <div className="text-sm text-zinc-400">
                <span className="text-zinc-500">Lingue:</span> {availableLanguages.join(', ')}
              </div>
            )}

            {availableConditions.length > 0 && (
              <div className="text-sm text-zinc-400">
                <span className="text-zinc-500">Condizioni:</span> {availableConditions.join(', ')}
              </div>
            )}

            {(categorySlug || collectionSlug) && (
              <div className="flex flex-wrap gap-2">
                {categorySlug && (
                  <Link
                    href={`/shop/categories/${categorySlug}`}
                    className="border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {categoryName}
                  </Link>
                )}
                {collectionSlug && (
                  <Link
                    href={`/shop/collections/${collectionSlug}`}
                    className="border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Collezione: {collectionName}
                  </Link>
                )}
              </div>
            )}

            {product.averageSalePrice && (
              <div className="rounded-lg border border-zinc-800 p-4">
                <p className="text-sm text-zinc-400">
                  Prezzo medio di vendita: <span className="font-bold text-white">€{product.averageSalePrice.toFixed(2)}</span>
                </p>
                {product.lastPriceUpdate && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Aggiornato: {new Date(product.lastPriceUpdate).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 border-2 border-zinc-800 p-4 shadow-[3px_3px_0px_0px_#27272a]">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Truck className="h-5 w-5 text-[var(--accent)]" />
                <span>Spedizione gratuita in Italia dagli 80 €</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield className="h-5 w-5 text-[var(--accent)]" />
                <span>Prodotto 100% originale</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Package className="h-5 w-5 text-[var(--accent)]" />
                <span>Packaging professionale e sicuro</span>
              </div>
            </div>
            </div>
          </Reveal>
        </div>

        <StickyAddToCart
          product={buyableProduct}
          maxQuantity={group.totalQuantity > 0 ? group.totalQuantity : 1}
        />

        {relatedGroups.length > 0 && (
          <section className="mt-16 border-t-2 border-zinc-800 pt-12">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">Prodotti Correlati</h2>
            <Reveal>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedGroups.slice(0, 4).map((g: any) => (
                <ProductCard
                  key={g.title}
                  product={{
                    id: 0,
                    title: g.title,
                    slug: g.slug,
                    storePrice: g.sellingPrice,
                    status: 'listed' as const,
                    condition: g.products[0]?.condition || '',
                    language: g.products[0]?.language || '',
                    category: g.category,
                    collection: g.collection,
                    imageUrl: g.image,
                  }}
                />
              ))}
            </div>
            </Reveal>
          </section>
        )}
      </div>
    </div>
  )
}
