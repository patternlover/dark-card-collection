'use client'

import { useState } from 'react'
import { getProductImageInfo } from '@/lib/product-image'
import { ProductImage } from './ProductImage'

interface ProductGalleryProps {
  product?: any
  imageUrl?: string | null
  images?: Array<{ image?: any } | null>
  fallbackImage?: any
  alt?: string
}

export function ProductGallery({
  product,
  imageUrl,
  images,
  fallbackImage,
  alt = '',
}: ProductGalleryProps) {
  const info = getProductImageInfo(product)
  const allUrls: string[] = []

  const primary = info.pdpUrl || imageUrl || images?.[0]?.image?.url || fallbackImage?.url || null
  if (primary) allUrls.push(primary)

  for (const img of images || []) {
    const url = getProductImageInfo({ image: img?.image }).pdpUrl
    if (url && !allUrls.includes(url)) allUrls.push(url)
  }

  if (fallbackImage?.url && !allUrls.includes(fallbackImage.url)) {
    allUrls.push(fallbackImage.url)
  }

  const [selectedIndex, setSelectedIndex] = useState(0)

  if (allUrls.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <span className="text-zinc-600 text-6xl">📦</span>
      </div>
    )
  }

  const mainSrc = allUrls[selectedIndex]!

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full rounded-lg border border-zinc-800 overflow-hidden">
        <ProductImage
          src={mainSrc}
          alt={alt}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>
      {allUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? 'border-white' : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <ProductImage
                src={url}
                alt={`${alt} ${i + 1}`}
                sizes="64px"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
