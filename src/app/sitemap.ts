import type { MetadataRoute } from 'next'
import { listCatalogCollections, listCatalogProducts } from '@/lib/medusa/products'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

export const revalidate = 3600

const staticRoutes = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/shop/bestsellers', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/shop/new-arrivals', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/shop/espansioni', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/guide', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/guide/dove-comprare-carte-pokemon-originali', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/guide/come-scegliere-booster-box', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/guide/etb-cosa-sono-elite-trainer-box', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/info/about', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/info/faq', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/info/contact', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/info/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
  { path: '/info/terms', priority: 0.2, changeFrequency: 'yearly' as const },
  { path: '/info/shipping-returns', priority: 0.5, changeFrequency: 'monthly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  try {
    const collections = await listCatalogCollections()
    for (const col of collections) {
      if (!col.handle) continue
      entries.push({
        url: `${SITE_URL}/shop/espansioni/${col.handle}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })
    }

    const products = await listCatalogProducts({ limit: 2000 })
    for (const product of products) {
      if (!product.slug) continue
      entries.push({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
    }
  } catch {
    // Medusa non raggiungibile durante il build: restituisci solo le rotte statiche
  }

  return entries
}
