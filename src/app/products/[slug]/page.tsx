import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { groupProducts } from '@/lib/group-products'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/product/ProductCard'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { Truck, Shield, Package } from 'lucide-react'
import type { Metadata } from 'next'
import { proxyImageUrl } from '@/lib/proxy-image'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const product = result.docs[0]
    if (!product) return { title: 'Prodotto non trovato' }
    return {
      title: product.title,
      description: product.description || `${product.title} - Dark Card Collection`,
    }
  } catch {
    return { title: 'Prodotto' }
  }
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

  const categoryName = product.category
    ? typeof product.category === 'object'
      ? product.category.name
      : product.category
    : ''

  const collectionName = product.collection
    ? typeof product.collection === 'object'
      ? product.collection.name
      : product.collection
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

  const imgSrc = proxyImageUrl(group.image)

  const buyableProduct = group.products.find((p: any) => p.status === 'listed' && p.storePrice && p.storePrice > 0) || product

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={product.title}
                className="w-full border-2 border-zinc-700 object-cover shadow-[4px_4px_0px_0px_#27272a]"
              />
            ) : (
              <div className="aspect-square w-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center shadow-[4px_4px_0px_0px_#27272a]">
                <span className="text-zinc-600 text-6xl">📦</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {product.condition === 'mint' && <Badge variant="new">Sigillato</Badge>}
              {product.condition === 'graded' && <Badge variant="bestseller">Graded</Badge>}
              {product.status === 'hold' && <Badge variant="preorder">In Attesa</Badge>}
              <Badge variant="default">
                {statusLabels[product.status] || product.status}
              </Badge>
            </div>

            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">
              <span>Shop</span>
              {categoryName && (
                <>
                  <span className="mx-2">/</span>
                  <span>{categoryName}</span>
                </>
              )}
              {collectionName && (
                <>
                  <span className="mx-2">/</span>
                  <span>{collectionName}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl font-black text-white uppercase tracking-tight">{product.title}</h1>

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-[#FACC15]">
                {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : 'Prezzo in arrivo'}
              </span>
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

            {product.description && (
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Descrizione</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <AddToCartButton product={buyableProduct} />

            <div className="space-y-3 border-2 border-zinc-800 p-4 shadow-[3px_3px_0px_0px_#27272a]">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Truck className="h-5 w-5 text-[#FACC15]" />
                <span>Spedizione gratuita sopra i €100</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield className="h-5 w-5 text-[#FACC15]" />
                <span>Prodotto 100% originale</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Package className="h-5 w-5 text-[#FACC15]" />
                <span>Packaging professionale e sicuro</span>
              </div>
            </div>
          </div>
        </div>

        {relatedGroups.length > 0 && (
          <section className="mt-16 border-t-2 border-zinc-800 pt-12">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">Prodotti Correlati</h2>
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
          </section>
        )}
      </div>
    </div>
  )
}
