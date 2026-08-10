import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { groupProducts } from '@/lib/group-products'
import { Badge } from '@/components/ui/Badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
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
      depth: 1,
    })
    const product = result.docs[0]
    if (!product) return { title: 'Prodotto non trovato' }

    const price =
      product.price && product.price > 0 ? `€${product.price.toFixed(2)}` : ''
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
      product.image_link || (firstImage && typeof firstImage === 'object' ? firstImage.url : null),
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

const GRADE_LABELS: Record<string, string> = {
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

  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  product = result.docs[0]

  const allVariants = await payload.find({
    collection: 'products',
    where: { title: { equals: product.title } },
    limit: 100,
    depth: 1,
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

  if (!product || !group) notFound()

  const displayPrice = product.price || 0

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

  const availableGrades = [...new Set(
    group.products
      .filter((p: any) => p.status === 'listed' && p.grade)
      .map((p: any) => GRADE_LABELS[p.grade] || p.grade)
  )]

  const imgSrc = group.imagePdp || group.image

  const buyableProduct =
    group.products.find(
      (p: any) => (p.status === 'listed' || p.status === 'hold') && p.price && p.price > 0,
    ) || product

  const badges = (
    <div className="flex flex-wrap gap-2">
      {product.grade === 'mint' && <Badge variant="new">Sigillato</Badge>}
      {product.grade === 'graded' && <Badge variant="bestseller">Graded</Badge>}
      {(product.is_preorder || product.status === 'hold') && <Badge variant="preorder">In Attesa</Badge>}
      <Badge variant="default">
        {statusLabels[product.status] || product.status}
      </Badge>
    </div>
  )

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Collezioni', href: '/shop/collections' },
  ]
  if (collectionSlug) {
    breadcrumbItems.push({ label: collectionName, href: `/shop/collections/${collectionSlug}` })
  }
  breadcrumbItems.push({ label: product.title })

  const productUrl = `${SITE_URL}/products/${product.slug}`
  const availability =
    product.status === 'sold'
      ? 'https://schema.org/OutOfStock'
      : product.status === 'hold' || product.is_preorder
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/InStock'
  const schemaImageUrl = absoluteUrl(group.imagePdp || group.image)
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const itemCondition =
    product.condition === 'refurbished'
      ? 'https://schema.org/RefurbishedCondition'
      : product.condition === 'new'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition'

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
      ...(product.item_group_id ? { sku: product.item_group_id } : {}),
      offers: {
        '@type': 'Offer',
        '@id': `${productUrl}#offer`,
        url: productUrl,
        priceCurrency: 'EUR',
        price: displayPrice > 0 ? displayPrice.toFixed(2) : '0',
        availability,
        itemCondition,
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
            <Breadcrumb items={breadcrumbItems} />
            {badges}
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
              <div className="hidden lg:block"><Breadcrumb items={breadcrumbItems} /></div>
              <div className="hidden lg:block">{badges}</div>

            <h1 className="text-3xl font-black text-white uppercase tracking-tight">{product.title}</h1>

            {product.description && (
              <p className="text-base text-zinc-400 leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-[var(--accent)]">
                {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : 'Prezzo in arrivo'}
              </span>
              {product.sale_price && product.sale_price > displayPrice && (
                <span className="text-lg font-medium text-zinc-500 line-through">
                  €{product.sale_price.toFixed(2)}
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

            {availableGrades.length > 0 && (
              <div className="text-sm text-zinc-400">
                <span className="text-zinc-500">Condizioni:</span> {availableGrades.join(', ')}
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

            {product.average_sale_price && (
              <div className="rounded-lg border border-zinc-800 p-4">
                <p className="text-sm text-zinc-400">
                  Prezzo medio di vendita: <span className="font-bold text-white">€{product.average_sale_price.toFixed(2)}</span>
                </p>
                {product.last_price_update && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Aggiornato: {formatDate(product.last_price_update)}
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
                <ProductCard key={g.title} group={g} />
              ))}
            </div>
            </Reveal>
          </section>
        )}
      </div>
    </div>
  )
}
