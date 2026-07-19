'use client'

import { useState } from 'react'

interface ProductGalleryProps {
  imageUrl?: string | null
  images: Array<{ image?: { url: string; alt?: string } | null } | null>
  fallbackImage?: { url: string; alt?: string } | null
  alt?: string
}

export function ProductGallery({ imageUrl, images, fallbackImage, alt = '' }: ProductGalleryProps) {
  const allUrls: string[] = []

  if (imageUrl) allUrls.push(imageUrl)

  for (const img of images) {
    const url = typeof img === 'object' && img?.image?.url ? img.image.url : null
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

  if (allUrls.length === 1) {
    return (
      <img
        src={allUrls[0]!}
        alt={alt}
        className="aspect-square w-full rounded-lg object-cover border border-zinc-800"
      />
    )
  }

  return (
    <div className="space-y-3">
      <img
        src={allUrls[selectedIndex]!}
        alt={alt}
        className="aspect-square w-full rounded-lg object-cover border border-zinc-800"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allUrls.map((url, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors ${
              i === selectedIndex ? 'border-white' : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <img
              src={url}
              alt={`${alt} ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
