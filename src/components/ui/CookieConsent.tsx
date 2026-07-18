'use client'

import { useState } from 'react'
import { Shield, Settings, X } from 'lucide-react'
import { useConsent } from '@/hooks/useConsent'

export function CookieConsent() {
  const { consent, hasInteracted, acceptAll, rejectAll, savePreferences } = useConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [tempPrefs, setTempPrefs] = useState({
    analytics: consent.analytics,
    marketing: consent.marketing,
  })

  if (hasInteracted) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 shrink-0 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">
              Rispettiamo la tua privacy
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              Utilizziamo cookie per garantire il funzionamento del sito e, previo tuo consenso,
              per analisi e marketing. Puoi gestire le tue preferenze in qualsiasi momento.
              Leggi la nostra{' '}
              <a href="/info/privacy" className="text-blue-400 underline hover:text-blue-300">
                Privacy Policy
              </a>{' '}
              per maggiori informazioni.
            </p>

            {!showDetails ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={acceptAll}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Accetta tutti
                </button>
                <button
                  onClick={rejectAll}
                  className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Rifiuta tutti
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Personalizza
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                    <div>
                      <span className="text-sm font-medium text-white">Necessari</span>
                      <p className="text-xs text-zinc-500">Essenziali per il funzionamento del sito</p>
                    </div>
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 cursor-pointer hover:border-zinc-600">
                    <div>
                      <span className="text-sm font-medium text-white">Analytics</span>
                      <p className="text-xs text-zinc-500">Ci aiutano a capire come usi il sito</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tempPrefs.analytics}
                      onChange={(e) => setTempPrefs(p => ({ ...p, analytics: e.target.checked }))}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 cursor-pointer hover:border-zinc-600">
                    <div>
                      <span className="text-sm font-medium text-white">Marketing</span>
                      <p className="text-xs text-zinc-500">Pubblicità personalizzate e remarketing</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tempPrefs.marketing}
                      onChange={(e) => setTempPrefs(p => ({ ...p, marketing: e.target.checked }))}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => savePreferences(tempPrefs)}
                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                  >
                    Salva preferenze
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Indietro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
