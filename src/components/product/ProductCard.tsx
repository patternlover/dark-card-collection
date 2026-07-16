import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

interface Product {
  id: string
  title: string
  slug: string
  price: number
  status: 'in-stock' | 'preorder' | 'out-of-stock'
  category: string
  isNew?: boolean
  isBestseller?: boolean
  compareAtPrice?: number
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const statusLabels = {
    'in-stock': 'Disponibile',
    'preorder': 'Preordine',
    'out-of-stock': 'Esaurito',
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-zinc-800" />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Badges */}
        <div className="mb-2 flex gap-2">
          {product.isNew && <Badge variant="new">Novità</Badge>}
          {product.isBestseller && <Badge variant="bestseller">Bestseller</Badge>}
          <Badge variant={product.status === 'preorder' ? 'preorder' : 'default'}>
            {statusLabels[product.status]}
          </Badge>
        </div>

        {/* Category */}
        <p className="text-xs text-zinc-500">{product.category}</p>

        {/* Title */}
        <h3 className="mt-1 text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              €{product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-zinc-500 line-through">
                €{product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
