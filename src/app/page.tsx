import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { FreeShippingBanner } from '@/components/sections/FreeShippingBanner'
import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { CollectionsShowcase } from '@/components/sections/CollectionsShowcase'
import { PromoBand } from '@/components/sections/PromoBand'
import { CartSocialProof } from '@/components/sections/CartSocialProof'
import { HomepageFaq } from '@/components/sections/HomepageFaq'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { TrustBadges } from '@/components/sections/TrustBadges'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Pokémon TCG Sigillati | Booster Box, ETB | Dark Card Collection',
  description:
    'Booster Box, ETB e Collection Box Pokémon TCG originali e sigillati. Spedizione gratuita in Italia dagli 80 €. Acquista online ora.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pokémon TCG Sigillati | Booster Box, ETB | Dark Card Collection',
    description:
      'Booster Box, ETB e Collection Box Pokémon TCG originali e sigillati. Spedizione gratuita in Italia dagli 80 €.',
    type: 'website',
    url: SITE_URL,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Dark Card Collection - Pokémon TCG sigillati',
      },
    ],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'OnlineStore',
      '@id': `${SITE_URL}/#organization`,
      name: 'Dark Card Collection',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      image: `${SITE_URL}/og.png`,
      description:
        'Negozio specializzato in prodotti Pokémon TCG sigillati: Booster Box, ETB, Collection Box e SPC.',
      priceRange: '€€',
      currenciesAccepted: 'EUR',
      paymentAccepted: 'Carta di credito, debito',
      areaServed: 'IT',
      email: 'darkcardcollection@gmail.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_URL}/info/contact`,
        email: 'darkcardcollection@gmail.com',
        areaServed: 'IT',
        availableLanguage: 'it',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Dark Card Collection',
      inLanguage: 'it-IT',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function Home() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <FreeShippingBanner />
      <HeroSection />
      <CartSocialProof />
      <FeaturedProducts />
      <CollectionsShowcase />
      <PromoBand />
      <HomepageFaq />
      <CtaBanner />
      <TrustBadges />
    </>
  )
}
