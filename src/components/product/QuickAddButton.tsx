'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { proxyImageUrl } from '@/lib/proxy-image'

interface QuickAddButtonProps {
  product: {
    id: number | string
    title: string
    slug: string
    storePrice: number | null
    imageUrl?: string | null
    status: string
  }
}

export function QuickAddButton({ product }: QuickAddButtonProps) {
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const price = product.storePrice || 0
  const isAvailable = product.status === 'listed' && price > 0

  if (!isAvailable) return null

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (added) return

    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price,
      image: proxyImageUrl(product.imageUrl) || null,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="flex h-9 w-9 items-center justify-center border-2 border-[#FACC15] bg-[#FACC15] text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:translate-0 active:shadow-none"
      title="Aggiungi al carrello"
    >
      {added ? (
        <Check className="h-4 w-4" strokeWidth={3} />
      ) : (
        <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
      )}
    </button>
  )
}
