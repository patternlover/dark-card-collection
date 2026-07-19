'use client'

import { useState } from 'react'

interface ProductGalleryProps {
  images: Array<{ image?: { url: string; alt?: string } | null } | null>
  fallbackImage?: { url: string; alt?: string } | null
  alt?: string
}

export function ProductGallery({ images, fallbackImage, alt = '' }: ProductGalleryProps) {
  const validImages = images
    .map((img) => (typeof img === 'object' && img?.image?.url ? img.image : null))
    .filter(Boolean) as Array<{ url: string; alt?: string }>

  if (fallbackImage?.url && validImages.length === 0) {
    validImages.push(fallbackImage)
  }

  const [selectedIndex, setSelectedIndex] = useState(0)

  if (validImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <span className="text-zinc-600 text-6xl">📦</span>
      </div>
    )
  }

  if (validImages.length === 1) {
    return (
      <img
        src={validImages[0]!.url}
        alt={validImages[0]!.alt || alt}
        className="aspect-square w-full rounded-lg object-cover border border-zinc-800"
      />
    )
  }

  return (
    <div className="space-y-3">
      <img
        src={validImages[selectedIndex]!.url}
        alt={validImages[selectedIndex]!.alt || alt}
        className="aspect-square w-full rounded-lg object-cover border border-zinc-800"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {validImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors ${
              i === selectedIndex ? 'border-white' : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <img
              src={img.url}
              alt={img.alt || `${alt} ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
