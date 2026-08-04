import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api/'],
      },
      ...aiCrawlers.map((crawler) => ({
        userAgent: crawler,
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api/'],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
