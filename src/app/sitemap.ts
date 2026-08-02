import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

export const revalidate = 3600

const staticRoutes = [
  '',
  '/shop',
  '/shop/bestsellers',
  '/shop/new-arrivals',
  '/shop/preorders',
  '/shop/collections',
  '/cart',
  '/info/about',
  '/info/faq',
  '/info/contact',
  '/info/privacy',
  '/info/terms',
  '/info/shipping-returns',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    const payload = await getPayloadClient()
    const products = await payload.find({
      collection: 'products',
      where: { status: { equals: 'listed' } },
      limit: 200,
    })

    for (const product of products.docs) {
      if (!product.slug) continue
      entries.push({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt || Date.now()),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
    }
  } catch {
    // DB non disponibile durante il build: restituisci solo le rotte statiche
  }

  return entries
}
