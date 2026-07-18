'use client'

import { useEffect } from 'react'
import { useConsent } from '@/hooks/useConsent'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { consent, hasInteracted } = useConsent()

  useEffect(() => {
    if (!hasInteracted || !consent.analytics || !GTM_ID) return

    window.dataLayer = window.dataLayer || []

    const script = document.createElement('script')
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_ID}');
    `
    document.head.appendChild(script)

    const noscript = document.createElement('noscript')
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
    document.body.appendChild(noscript)

    return () => {
      script.remove()
      noscript.remove()
    }
  }, [consent.analytics, hasInteracted])

  return <>{children}</>
}
