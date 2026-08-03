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
  description:
    'Negozio specializzato in prodotti Pokémon TCG sigillati: Booster Box, ETB, Collection Box e SPC. Originali al 100%, spedizione gratuita in Italia dagli 80 €.',
  keywords: ['pokemon tcg', 'booster box', 'etb', 'collection box', 'carte pokemon', 'sealed products', 'pokemon sigillati', 'dove comprare carte pokemon', 'elite trainer box'],
  robots: {
    index: true,
    follow: true,
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
  icons: {
    icon: '/icon.svg',
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
