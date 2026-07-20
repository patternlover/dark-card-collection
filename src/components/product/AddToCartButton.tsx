'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { trackAddToCart } from '@/lib/analytics'
import { proxyImageUrl } from '@/lib/proxy-image'

interface AddToCartButtonProps {
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
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const displayPrice = product.storePrice || 0

  const handleAdd = () => {
    if (displayPrice <= 0 || product.status !== 'listed') return

    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: displayPrice,
      image: proxyImageUrl(product.imageUrl || product.images?.[0]?.image?.url || product.image?.url) || null,
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
      className="flex w-full items-center justify-center gap-2 border-2 border-[#FACC15] bg-[#FACC15] px-6 py-4 text-base font-bold text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-0 active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-0 disabled:hover:shadow-[4px_4px_0px_0px_#000]"
    >
      {added ? (
        <>
          <Check className="h-5 w-5" strokeWidth={3} />
          Aggiunto!
        </>
      ) : !isAvailable ? (
        'Non disponibile'
      ) : (
        <>
          <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
          Aggiungi al carrello
        </>
      )}
    </button>
  )
}
