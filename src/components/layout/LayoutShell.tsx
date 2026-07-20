'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CookieConsent } from '@/components/ui/CookieConsent'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/dashboard')

  return (
    <>
      {!isAdminArea && <Header />}
      <main className="min-h-screen">
        {children}
      </main>
      {!isAdminArea && <Footer />}
      {!isAdminArea && <CookieConsent />}
    </>
  )
}
