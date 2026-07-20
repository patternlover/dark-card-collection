import Link from 'next/link'
import { proxyImageUrl } from '@/lib/proxy-image'
import { QuickAddButton } from './QuickAddButton'
import type { ProductGroup } from '@/lib/group-products'

interface ProductGroupCardProps {
  group: ProductGroup
}

export function ProductGroupCard({ group }: ProductGroupCardProps) {
  const imgSrc = proxyImageUrl(group.image)
  const collectionName = group.collection?.name || ''

  const cheapest = group.products.find(
    (p: any) => p.status === 'listed' && p.storePrice && p.storePrice > 0
  )

  return (
    <div className="group relative border-2 border-zinc-700 bg-zinc-900 shadow-[3px_3px_0px_0px_#27272a] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#FACC15]">
      <Link
        href={`/products/${group.slug}`}
        className="block"
      >
        <div className="p-3">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={group.title}
              className="aspect-square w-full object-cover border border-zinc-800"
              loading="lazy"
            />
          ) : (
            <div className="aspect-square w-full bg-zinc-800 flex items-center justify-center border border-zinc-800">
              <span className="text-zinc-600 text-4xl">📦</span>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          {collectionName && (
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{collectionName}</p>
          )}

          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
            {group.title}
          </h3>

          <div className="mt-3">
            <span className="text-lg font-bold text-[#FACC15]">
              {group.sellingPrice > 0 ? `€${group.sellingPrice.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>
      </Link>

      {cheapest && (
        <div className="absolute bottom-3 right-3">
          <QuickAddButton product={cheapest} />
        </div>
      )}
    </div>
  )
}
