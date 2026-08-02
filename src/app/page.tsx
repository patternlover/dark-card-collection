import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { Marquee } from '@/components/sections/Marquee'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { PromoBand } from '@/components/sections/PromoBand'
import { TrustBadges } from '@/components/sections/TrustBadges'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

export const metadata: Metadata = {
  title: 'Dark Card Collection | Pokémon TCG Sigillati',
  description:
    'Negozio specializzato in prodotti Pokémon TCG sigillati. Booster Box, ETB, Collection Box, SPC e molto altro. Spedizione gratuita sopra 100 €.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Dark Card Collection | Pokémon TCG Sigillati',
    description:
      'Negozio specializzato in prodotti Pokémon TCG sigillati. Booster Box, ETB, Collection Box, SPC e molto altro.',
    type: 'website',
    url: SITE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Dark Card Collection',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_URL}/info/contact`,
      },
    },
    {
      '@type': 'WebSite',
      name: 'Dark Card Collection',
      url: SITE_URL,
      inLanguage: 'it-IT',
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Marquee />
      <HeroSection />
      <FeaturedProducts />
      <PromoBand />
      <TrustBadges />
    </>
  )
}
