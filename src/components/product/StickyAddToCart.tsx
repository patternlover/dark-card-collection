'use client'

import { AddToCartButton } from './AddToCartButton'

interface StickyAddToCartProps {
  product: {
    id: number | string
    title: string
    slug: string
    price: number
    storePrice?: number | null
    image?: { url: string; alt: string } | null
    images?: Array<{ image?: { url: string; alt: string } | null }> | null
    imageUrl?: string | null
    status: string
  }
  maxQuantity?: number
}

export function StickyAddToCart({ product, maxQuantity = 1 }: StickyAddToCartProps) {
  const displayPrice = product.storePrice || 0

  return (
    <div
      data-testid="sticky-atc"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--accent)] bg-black/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_0px_0px_#000] backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 shrink-0">
          <p className="text-lg font-black leading-none text-[var(--accent)]">
            {displayPrice > 0 ? `€${displayPrice.toFixed(2)}` : 'Prezzo in arrivo'}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {maxQuantity > 0
              ? `${maxQuantity} disponibil${maxQuantity === 1 ? 'e' : 'i'}`
              : 'Non disponibile'}
          </p>
        </div>
        <div className="w-full max-w-sm sm:max-w-md">
          <AddToCartButton product={product} maxQuantity={maxQuantity} />
        </div>
      </div>
    </div>
  )
}
