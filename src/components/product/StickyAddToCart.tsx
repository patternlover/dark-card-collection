'use client'

import { useEffect, useRef, useState } from 'react'
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
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef}>
        <AddToCartButton product={product} maxQuantity={maxQuantity} />
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-zinc-700 bg-black/95 p-3 backdrop-blur transition-transform duration-300 ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <AddToCartButton product={product} maxQuantity={maxQuantity} compact />
        </div>
      </div>
    </>
  )
}
