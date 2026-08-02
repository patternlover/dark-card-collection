import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { getProductImageInfo } from '@/lib/product-image'
import { ProductImage } from './ProductImage'
import { QuickAddButton } from './QuickAddButton'

interface Product {
  id: number | string
  title: string
  slug: string
  price?: number
  storePrice?: number
  compareAtPrice?: number
  status: 'listed' | 'hold' | 'sold'
  isPreorder?: boolean
  condition: string
  language: string
  category?: { name: string } | null
  collection?: { name: string } | null
  image?: { url: string; alt: string } | null
  images?: Array<{ image?: { url: string; alt: string } | null }> | null
  imageUrl?: string | null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const displayPrice = product.storePrice || 0
  const imgUrl = getProductImageInfo(product).cardUrl

  return (
    <div className="group relative border-2 border-zinc-700 bg-zinc-900 shadow-[3px_3px_0px_0px_#27272a] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#FACC15]">
      <Link
        href={`/products/${product.slug}`}
        className="block"
      >
        <div className="p-3">
          <div className="relative aspect-square w-full">
            {imgUrl ? (
              <ProductImage
                src={imgUrl}
                alt={product.title}
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="border border-zinc-800 object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center border border-zinc-800 bg-zinc-800">
                <span className="text-4xl text-zinc-600">📦</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(product.isPreorder || product.status === 'hold') && <Badge variant="preorder">In Attesa</Badge>}
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
