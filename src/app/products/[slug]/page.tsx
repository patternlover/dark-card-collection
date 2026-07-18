import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/product/ProductCard'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { Truck, Shield, Package } from 'lucide-react'
import type { Metadata } from 'next'

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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let product: any = null
  let relatedProducts: any[] = []

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
        limit: 4,
      })
      relatedProducts = related.docs
    }
  } catch {
    notFound()
  }

  if (!product) notFound()

  const displayPrice = product.storePrice || product.price || 0

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

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            {product.image?.url ? (
              <img
                src={product.image.url}
                alt={product.image.alt || product.title}
                className="aspect-square w-full rounded-lg object-cover border border-zinc-800"
              />
            ) : (
              <div className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
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

            <div className="text-sm text-zinc-500">
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

            <h1 className="text-3xl font-bold text-white">{product.title}</h1>

            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-white">
                {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : 'Prezzo in arrivo'}
              </span>
              {product.compareAtPrice && product.compareAtPrice > displayPrice && (
                <span className="text-lg text-zinc-500 line-through">
                  €{product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex gap-4 text-sm text-zinc-400">
              {product.language && <span>Lingua: {product.language}</span>}
              {product.condition && <span>Condizione: {product.condition}</span>}
              {product.itemId && <span>ID: {product.itemId}</span>}
            </div>

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

            <AddToCartButton product={product} />

            <div className="space-y-3 rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Truck className="h-5 w-5 text-zinc-500" />
                <span>Spedizione gratuita sopra i €100</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield className="h-5 w-5 text-zinc-500" />
                <span>Prodotto 100% originale</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Package className="h-5 w-5 text-zinc-500" />
                <span>Packaging professionale e sicuro</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-zinc-800 pt-12">
            <h2 className="text-2xl font-bold text-white mb-8">Prodotti Correlati</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
