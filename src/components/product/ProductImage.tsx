import Image from 'next/image'
import { proxyImageUrl } from '@/lib/proxy-image'

const BLOB_HOST_SUFFIX = '.blob.vercel-storage.com'

function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}

interface ProductImageProps {
  src: string | null
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}

export function ProductImage({ src, alt, sizes, priority = false, className }: ProductImageProps) {
  if (!src) return null

  if (isBlobUrl(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={82}
        className={className}
      />
    )
  }

  return (
    <img
      src={proxyImageUrl(src) || src}
      alt={alt}
      width={800}
      height={800}
      loading={priority ? undefined : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={`h-full w-full ${className || ''}`}
    />
  )
}
