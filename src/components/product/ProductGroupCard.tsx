import Link from 'next/link'
import { proxyImageUrl } from '@/lib/proxy-image'
import type { ProductGroup } from '@/lib/group-products'

interface ProductGroupCardProps {
  group: ProductGroup
}

export function ProductGroupCard({ group }: ProductGroupCardProps) {
  const imgSrc = proxyImageUrl(group.image)
  const categoryName = group.category?.name || ''
  const collectionName = group.collection?.name || ''

  return (
    <Link
      href={`/products/${group.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50"
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={group.title}
          className="aspect-[4/5] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-[4/5] w-full bg-zinc-800 flex items-center justify-center">
          <span className="text-zinc-600 text-4xl">📦</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {categoryName && (
          <p className="text-xs text-zinc-500 mb-1">{categoryName}</p>
        )}

        <h3 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
          {group.title}
        </h3>

        {collectionName && (
          <p className="text-xs text-zinc-600 mt-1">{collectionName}</p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white">
            {group.sellingPrice > 0 ? `€${group.sellingPrice.toFixed(2)}` : 'Prezzo in arrivo'}
          </span>
          {group.totalQuantity > 0 && (
            <span className="text-xs text-zinc-500 rounded-full bg-zinc-800 px-2.5 py-1">
              {group.totalQuantity} disp.
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
