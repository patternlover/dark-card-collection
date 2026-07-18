'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface ConsentState {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

interface ConsentContextType {
  consent: ConsentState
  hasInteracted: boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (prefs: Omit<ConsentState, 'necessary'>) => void
}

const ConsentContext = createContext<ConsentContextType | null>(null)

const STORAGE_KEY = 'dcc-cookie-consent'

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  })
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConsent({ ...parsed, necessary: true })
        setHasInteracted(true)
      }
    } catch {}
  }, [])

  const persistConsent = useCallback((state: ConsentState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setConsent(state)
    setHasInteracted(true)

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'consent_update',
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.marketing ? 'granted' : 'denied',
    })
  }, [])

  const acceptAll = useCallback(() => {
    persistConsent({ necessary: true, analytics: true, marketing: true })
  }, [persistConsent])

  const rejectAll = useCallback(() => {
    persistConsent({ necessary: true, analytics: false, marketing: false })
  }, [persistConsent])

  const savePreferences = useCallback((prefs: Omit<ConsentState, 'necessary'>) => {
    persistConsent({ necessary: true, ...prefs })
  }, [persistConsent])

  return (
    <ConsentContext.Provider value={{ consent, hasInteracted, acceptAll, rejectAll, savePreferences }}>
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    return {
      consent: { necessary: true, analytics: false, marketing: false },
      hasInteracted: false,
      acceptAll: () => {},
      rejectAll: () => {},
      savePreferences: () => {},
    }
  }
  return ctx
}
