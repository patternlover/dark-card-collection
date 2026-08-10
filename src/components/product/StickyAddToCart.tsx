'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AddToCartButton } from './AddToCartButton'

interface StickyAddToCartProps {
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

export function StickyAddToCart({ product, maxQuantity = 1 }: StickyAddToCartProps) {
  const [mounted, setMounted] = useState(false)
  const [footerOffset, setFooterOffset] = useState(0)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    const footer = document.querySelector('footer')
    if (!footer) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = footer.getBoundingClientRect()
      const visible = Math.max(
        0,
        Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top),
      )
      setFooterOffset(visible)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mounted])

  const displayPrice = product.price || 0

  if (!mounted) return null

  return createPortal(
    <div
      data-testid="sticky-atc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t-2 border-[var(--accent)] bg-black pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_0px_0px_#000]"
      style={footerOffset > 0 ? { bottom: `${footerOffset}px` } : undefined}
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
    </div>,
    document.body,
  )
}
