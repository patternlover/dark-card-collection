import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

export const revalidate = 3600

const staticRoutes = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/shop/bestsellers', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/shop/new-arrivals', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/shop/preorders', priority: 0.7, changeFrequency: 'daily' as const },
  { path: '/shop/collections', priority: 0.9, changeFrequency: 'weekly' as const },
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
    const payload = await getPayloadClient()

    const collections = await payload.find({
      collection: 'collections',
      limit: 500,
      sort: 'name',
    })
    for (const col of collections.docs) {
      if (!col.slug) continue
      entries.push({
        url: `${SITE_URL}/shop/collections/${col.slug}`,
        lastModified: new Date(col.updatedAt || Date.now()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })
    }

    const categories = await payload.find({
      collection: 'categories',
      limit: 500,
      sort: 'name',
    })
    for (const cat of categories.docs) {
      if (!cat.slug) continue
      entries.push({
        url: `${SITE_URL}/shop/categories/${cat.slug}`,
        lastModified: new Date(cat.updatedAt || Date.now()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })
    }

    let page = 1
    while (page <= 20) {
      const products = await payload.find({
        collection: 'products',
        where: {
          and: [
            { status: { in: ['listed', 'hold', 'sold'] } },
            { is_visible: { equals: true } },
          ],
        },
        limit: 100,
        page,
        sort: 'updatedAt',
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

      if (page >= products.totalPages || products.docs.length === 0) break
      page += 1
    }
  } catch {
    // DB non disponibile durante il build: restituisci solo le rotte statiche
  }

  return entries
}
