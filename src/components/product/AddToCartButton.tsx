'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { trackAddToCart } from '@/lib/analytics'

interface AddToCartButtonProps {
  product: {
    id: number | string
    title: string
    slug: string
    price: number
    storePrice?: number | null
    image?: { url: string; alt: string } | null
    status: string
  }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const displayPrice = product.storePrice || product.price || 0

  const handleAdd = () => {
    if (displayPrice <= 0 || product.status !== 'listed') return

    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: displayPrice,
      image: product.image?.url || null,
    })

    trackAddToCart({
      item_id: String(product.id),
      item_name: product.title,
      price: displayPrice,
      currency: 'EUR',
      quantity: 1,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const isAvailable = product.status === 'listed' && displayPrice > 0

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!isAvailable || added}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-base font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {added ? (
        <>
          <Check className="h-5 w-5" />
          Aggiunto!
        </>
      ) : !isAvailable ? (
        'Non disponibile'
      ) : (
        <>
          <ShoppingBag className="h-5 w-5" />
          Aggiungi al carrello
        </>
      )}
    </button>
  )
}
