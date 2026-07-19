import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

interface Product {
  id: number | string
  title: string
  slug: string
  price?: number
  storePrice?: number
  compareAtPrice?: number
  status: 'listed' | 'hold' | 'sold'
  condition: string
  language: string
  category?: { name: string } | null
  collection?: { name: string } | null
  image?: { url: string; alt: string } | null
  images?: Array<{ image?: { url: string; alt: string } | null }> | null
  imageUrl?: string | null
}

function getProductImage(product: Product): string | null {
  if (product.imageUrl) return product.imageUrl
  if (product.images?.[0]?.image?.url) return product.images[0].image.url
  if (product.image?.url) return product.image.url
  return null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const statusLabels: Record<string, string> = {
    listed: 'Disponibile',
    hold: 'In Attesa',
    sold: 'Venduto',
  }

  const displayPrice = product.storePrice || product.price || 0
  const imgUrl = getProductImage(product)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
    >
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={product.title}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="aspect-square bg-zinc-800 flex items-center justify-center">
          <span className="text-zinc-600 text-4xl">📦</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {product.status === 'hold' && <Badge variant="preorder">In Attesa</Badge>}
          {product.condition === 'mint' && <Badge variant="new">Sigillato</Badge>}
          {product.condition === 'graded' && <Badge variant="bestseller">Graded</Badge>}
        </div>

        {product.category && (
          <p className="text-xs text-zinc-500">
            {typeof product.category === 'object' ? product.category.name : product.category}
          </p>
        )}

        <h3 className="mt-1 text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
          {product.title}
        </h3>

        {product.collection && (
          <p className="mt-1 text-xs text-zinc-600">
            {typeof product.collection === 'object' ? product.collection.name : product.collection}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : 'Prezzo in arrivo'}
            </span>
            {product.compareAtPrice && product.compareAtPrice > displayPrice && (
              <span className="text-sm text-zinc-500 line-through">
                €{product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="mt-1 flex gap-2">
            <span className="text-[10px] uppercase text-zinc-600">{product.language}</span>
            <span className="text-[10px] uppercase text-zinc-600">{product.condition}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
