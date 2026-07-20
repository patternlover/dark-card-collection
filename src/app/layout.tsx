import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { ConsentProvider } from '@/hooks/useConsent'
import { AnalyticsProvider } from '@/components/layout/AnalyticsProvider'
import { LayoutShell } from '@/components/layout/LayoutShell'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Dark Card Collection | Pokémon TCG Sigillati',
    template: '%s | Dark Card Collection',
  },
  description: 'Negozio specializzato in prodotti Pokémon TCG sigillati. Booster Box, ETB, Collection Box, SPC e molto altro.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'),
  openGraph: {
    title: 'Dark Card Collection',
    description: 'Negozio specializzato in prodotti Pokémon TCG sigillati.',
    type: 'website',
    locale: 'it_IT',
  },
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
