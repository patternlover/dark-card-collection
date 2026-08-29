import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { AuthProvider } from '@/hooks/useAuth'
import { ConsentProvider } from '@/hooks/useConsent'
import { AnalyticsProvider } from '@/components/layout/AnalyticsProvider'
import { ConsentModeScript } from '@/components/layout/ConsentModeScript'
import { LayoutShell } from '@/components/layout/LayoutShell'
import { RouteProgress } from '@/components/ui/RouteProgress'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  themeColor: '#FACC15',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Dark Card Collection | Pokémon TCG Sigillati',
    template: '%s | Dark Card Collection',
  },
  description:
    'Negozio specializzato in prodotti Pokémon TCG sigillati: Booster Box, ETB, Collection Box e SPC. Originali al 100%, spedizione gratuita in Italia dagli 80 €.',
  keywords: ['pokemon tcg', 'booster box', 'etb', 'collection box', 'carte pokemon', 'sealed products', 'pokemon sigillati', 'dove comprare carte pokemon', 'elite trainer box'],
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Dark Card Collection | Pokémon TCG Sigillati',
    description:
      'Booster Box, ETB e Collection Box Pokémon TCG originali e sigillati. Spedizione gratuita in Italia dagli 80 €.',
    type: 'website',
    locale: 'it_IT',
    siteName: 'Dark Card Collection',
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
  twitter: {
    card: 'summary_large_image',
    title: 'Dark Card Collection | Pokémon TCG Sigillati',
    description:
      'Booster Box, ETB e Collection Box Pokémon TCG originali e sigillati. Spedizione gratuita dagli 80 € in Italia.',
    images: ['/og.png'],
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  applicationName: 'Dark Card Collection',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConsentModeScript />
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
        {/* hreflang renderizzato minuscolo per compatibilità crawler (React usa hrefLang di default) */}
        <link rel="alternate" {...({ hreflang: 'it-IT', href: '/' } as React.HTMLAttributes<HTMLLinkElement>)} />
        <link rel="alternate" {...({ hreflang: 'x-default', href: '/' } as React.HTMLAttributes<HTMLLinkElement>)} />
        <noscript>
          <ul className="hidden">
            <li><a href="/shop">Shop</a></li>
            <li><a href="/shop/espansioni">Espansioni</a></li>
            <li><a href="/guide">Guide</a></li>
            <li><a href="/info/faq">FAQ</a></li>
            <li><a href="/info/about">Chi Siamo</a></li>
            <li><a href="/info/contact">Contatti</a></li>
          </ul>
        </noscript>
        <ConsentProvider>
          <AnalyticsProvider>
            <AuthProvider>
              <CartProvider>
                <LayoutShell>{children}</LayoutShell>
              </CartProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </ConsentProvider>
      </body>
    </html>
  )
}
