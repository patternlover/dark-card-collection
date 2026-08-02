import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { ConsentProvider } from '@/hooks/useConsent'
import { AnalyticsProvider } from '@/components/layout/AnalyticsProvider'
import { LayoutShell } from '@/components/layout/LayoutShell'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

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
  description: 'Negozio specializzato in prodotti Pokémon TCG sigillati. Booster Box, ETB, Collection Box, SPC e molto altro.',
  keywords: ['pokemon tcg', 'booster box', 'etb', 'collection box', 'carte pokemon', 'sealed products', 'pokemon sigillati'],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Dark Card Collection',
    description: 'Negozio specializzato in prodotti Pokémon TCG sigillati.',
    type: 'website',
    locale: 'it_IT',
    siteName: 'Dark Card Collection',
    url: SITE_URL,
  },
  icons: {
    icon: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConsentProvider>
          <AnalyticsProvider>
            <CartProvider>
              <LayoutShell>{children}</LayoutShell>
            </CartProvider>
          </AnalyticsProvider>
        </ConsentProvider>
      </body>
    </html>
  )
}
