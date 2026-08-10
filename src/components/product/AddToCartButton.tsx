'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { trackAddToCart } from '@/lib/analytics'
import { proxyImageUrl } from '@/lib/proxy-image'
import { getProductImageInfo } from '@/lib/product-image'
import { ConfettiBurst } from '@/components/ui/ConfettiBurst'

interface AddToCartButtonProps {
  product: {
    id: number | string
    title: string
    slug: string
    price: number
    image?: { url: string; alt: string } | null
    images?: Array<{ image?: { url: string; alt: string } | null }> | null
    image_link?: string | null
    status: string
  }
  maxQuantity?: number
}

export function AddToCartButton({ product, maxQuantity = 1 }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null)
  const { addItem } = useCart()

  const displayPrice = product.price || 0
  const isAvailable = (product.status === 'listed' || product.status === 'hold') && displayPrice > 0
  const maxQty = Math.max(1, Math.floor(maxQuantity))

  const handleAdd = (e: React.MouseEvent) => {
    if (!isAvailable || added) return

    addItem(
      {
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: displayPrice,
        image: proxyImageUrl(getProductImageInfo(product).cardUrl) || null,
        maxQuantity: maxQty,
      },
      quantity,
    )

    trackAddToCart({
      item_id: String(product.id),
      item_name: product.title,
      price: displayPrice,
      currency: 'EUR',
      quantity,
    })

    setBurst({ x: e.clientX, y: e.clientY, id: Date.now() })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex w-full items-stretch gap-2">
      <select
        aria-label="Quantità"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        disabled={!isAvailable}
        className="w-16 border-2 border-zinc-700 bg-zinc-900 px-2 py-2 text-center text-sm font-bold text-white focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
      >
        {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!isAvailable || added}
        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-0 active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed ${added ? 'animate-atc-pop' : ''}`}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" strokeWidth={3} />
            Aggiunto!
          </>
        ) : !isAvailable ? (
          'Non disponibile'
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
            Aggiungi al carrello
          </>
        )}
      </button>
      {burst && (
        <ConfettiBurst
          key={burst.id}
          x={burst.x}
          y={burst.y}
          onDone={() => setBurst(null)}
        />
      )}
    </div>
  )
}
