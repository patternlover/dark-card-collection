'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CookieConsent } from '@/components/ui/CookieConsent'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/dashboard')

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {!isAdminArea && <Header />}
      <main className="flex-1">{children}</main>
      {!isAdminArea && <Footer />}
      {!isAdminArea && <CookieConsent />}
    </div>
  )
}
