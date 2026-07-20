import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { proxyImageUrl } from '@/lib/proxy-image'
import { QuickAddButton } from './QuickAddButton'

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
  const displayPrice = product.storePrice || 0
  const imgUrl = proxyImageUrl(getProductImage(product))

  return (
    <div className="group relative border-2 border-zinc-700 bg-zinc-900 shadow-[3px_3px_0px_0px_#27272a] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#FACC15]">
      <Link
        href={`/products/${product.slug}`}
        className="block"
      >
        <div className="p-3">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product.title}
              className="aspect-square w-full object-cover border border-zinc-800"
            />
          ) : (
            <div className="aspect-square w-full bg-zinc-800 flex items-center justify-center border border-zinc-800">
              <span className="text-zinc-600 text-4xl">📦</span>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.status === 'hold' && <Badge variant="preorder">In Attesa</Badge>}
            {product.condition === 'mint' && <Badge variant="new">Sigillato</Badge>}
            {product.condition === 'graded' && <Badge variant="bestseller">Graded</Badge>}
          </div>

          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
            {product.title}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-[#FACC15]">
              {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">{product.language}</span>
          </div>
        </div>
      </Link>

      <div className="absolute bottom-3 right-3">
        <QuickAddButton product={product as any} />
      </div>
    </div>
  )
}
