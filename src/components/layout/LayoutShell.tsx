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
      <div className="min-h-screen bg-[#0a0a0a]">
        {!isAdminArea && <Header />}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
      {!isAdminArea && <Footer />}
      {!isAdminArea && <CookieConsent />}
    </>
  )
}
