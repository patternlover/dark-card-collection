const PROXY_HOSTS = [
  'product-images.s3.cardmarket.com',
  'images.cardmarket.com',
  'cdn.cardmarket.com',
]

export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (PROXY_HOSTS.includes(parsed.hostname)) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`
    }
  } catch {
    // not a valid URL
  }

  return url
}
