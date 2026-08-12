'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { trackAddToCart } from '@/lib/analytics'
import { proxyImageUrl } from '@/lib/proxy-image'
import { getProductImageInfo } from '@/lib/product-image'
import { ConfettiBurst } from '@/components/ui/ConfettiBurst'

interface QuickAddButtonProps {
  product: {
    id: number | string
    title: string
    slug: string
    price: number | null
    image_link?: string | null
    status: string
    quantity?: number
  }
  maxQuantity?: number
}

export function QuickAddButton({ product, maxQuantity }: QuickAddButtonProps) {
  const [added, setAdded] = useState(false)
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null)
  const { addItem } = useCart()

  const price = product.price || 0
  const availableQty = maxQuantity ?? product.quantity ?? 0
  const isAvailable =
    (product.status === 'listed' || product.status === 'hold') && price > 0 && availableQty > 0

  if (!isAvailable) return null

  const maxQty = Math.floor(availableQty)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (added) return

    addItem(
      {
        id: product.id,
        title: product.title,
        slug: product.slug,
        price,
        image: proxyImageUrl(getProductImageInfo(product).cardUrl) || null,
        maxQuantity: maxQty,
      },
      1,
    )

    trackAddToCart({
      item_id: String(product.id),
      item_name: product.title,
      price,
      currency: 'EUR',
      quantity: 1,
    })

    setBurst({ x: e.clientX, y: e.clientY, id: Date.now() })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        className={`flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-[var(--accent)] bg-[var(--accent)] text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:translate-0 active:shadow-none ${added ? 'animate-atc-pop' : ''}`}
        title="Aggiungi al carrello"
      >
        {added ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
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
    </>
  )
}
