import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ProductImage } from './ProductImage'
import { QuickAddButton } from './QuickAddButton'
import type { ProductGroup } from '@/lib/group-products'

interface ProductCardProps {
  group: ProductGroup
}

export function ProductCard({ group }: ProductCardProps) {
  const imgSrc = group.imageCard || group.image
  const collectionName = group.collection?.name || ''

  const cheapest = group.products.find(
    (p: any) => (p.status === 'listed' || p.status === 'hold') && p.price && p.price > 0,
  )

  const isSoldOut = group.totalQuantity <= 0
  const isPreorderOrHold = group.products.some(
    (p: any) => p.is_preorder || p.status === 'hold',
  )
  const isMint = group.products.some((p: any) => p.grade === 'mint')
  const isGraded = group.products.some((p: any) => p.grade === 'graded')

  return (
    <div className="group relative flex h-full flex-col border-2 border-zinc-700 bg-zinc-900 shadow-[3px_3px_0px_0px_#27272a] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--accent)]">
      <Link href={`/products/${group.slug}`} className="flex flex-1 flex-col">
        <div className="p-3">
          <div className="relative aspect-square w-full">
            {imgSrc ? (
              <ProductImage
                src={imgSrc}
                alt={group.title}
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

        <div className="mt-auto px-4 pb-4">
          {collectionName && (
            <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">{collectionName}</p>
          )}

          <div className="mb-2 flex flex-wrap gap-1.5">
            {group.itemCategory1 === 'card' ? (
              <Badge variant="card">Carta</Badge>
            ) : (
              <Badge variant="new">Prodotto</Badge>
            )}
            {isPreorderOrHold && <Badge variant="preorder">In Attesa</Badge>}
            {isMint && <Badge variant="new">Sigillato</Badge>}
            {isGraded && <Badge variant="bestseller">Graded</Badge>}
            {isSoldOut && <Badge variant="sold-out">Esaurito</Badge>}
          </div>

          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
            {group.title}
          </h3>

          <div className="mt-3 pr-14">
            <span className="text-lg font-bold text-[var(--accent)]">
              {group.sellingPrice > 0 ? `€${group.sellingPrice.toFixed(2)}` : ''}
            </span>
            {group.totalQuantity > 0 && (
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {group.totalQuantity} disponibil{group.totalQuantity === 1 ? 'e' : 'i'}
              </p>
            )}
          </div>
        </div>
      </Link>

      {cheapest && (
        <div className="absolute bottom-3 right-3">
          <QuickAddButton product={cheapest} maxQuantity={group.totalQuantity} />
        </div>
      )}
    </div>
  )
}
