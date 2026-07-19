'use client'

import { useState } from 'react'
import { syncInventory } from './actions'

interface SyncResult {
  success?: boolean
  authenticated?: boolean
  categories?: number
  collections?: number
  productsCreated?: number
  productsUpdated?: number
  imagesUploaded?: number
  skipped?: number
  imageErrors?: string[]
  debug?: string[]
  error?: string
  details?: string
}

export default function SyncPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(false)
    setAuthenticated(true)
  }

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)

    try {
      const data = await syncInventory(password)
      setResult(data)
      if (data.authenticated === false) {
        setAuthError(true)
        setAuthenticated(false)
        return
      }
      if (data.success) {
        setLastSync(new Date().toLocaleString('it-IT'))
      }
    } catch (err) {
      setResult({ error: 'Failed to connect', details: String(err) })
    } finally {
      setSyncing(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8">
          <h1 className="text-2xl font-bold text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            autoFocus
          />
          {authError && (
            <p className="text-sm text-red-400">Password non valida</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black px-4 py-3 font-medium hover:bg-zinc-200 transition-colors"
          >
            Accedi
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Sincronizzazione Inventario</h1>
          <button
            onClick={() => { setAuthenticated(false); setPassword(''); setResult(null) }}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Esci
          </button>
        </div>
        <p className="text-zinc-400 mb-8">
          Importa e aggiorna i prodotti dal Google Sheet
        </p>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-lg bg-white text-black px-6 py-3 font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sincronizzazione in corso...
            </span>
          ) : (
            'Sincronizza Ora'
          )}
        </button>

        {lastSync && (
          <p className="mt-4 text-sm text-zinc-500">Ultima sincronizzazione: {lastSync}</p>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            {result.success ? (
              <div className="rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-green-400 mb-4">Completato</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Categorie create:</span>{' '}
                    <span className="font-medium">{result.categories || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Collezioni create:</span>{' '}
                    <span className="font-medium">{result.collections || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Prodotti creati:</span>{' '}
                    <span className="font-medium">{result.productsCreated || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Prodotti aggiornati:</span>{' '}
                    <span className="font-medium">{result.productsUpdated || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Immagini caricate:</span>{' '}
                    <span className={`font-medium ${result.imagesUploaded === 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {result.imagesUploaded || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Righe saltate:</span>{' '}
                    <span className="font-medium">{result.skipped || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-900 p-6">
                <h2 className="text-lg font-semibold text-red-400 mb-2">Errore</h2>
                <p className="text-sm text-zinc-400">{result.error}</p>
                {result.details && (
                  <pre className="mt-2 text-xs text-zinc-600 whitespace-pre-wrap">{result.details}</pre>
                )}
              </div>
            )}

            {result.imageErrors && result.imageErrors.length > 0 && (
              <div className="rounded-lg border border-red-900 p-6">
                <h3 className="text-sm font-semibold text-red-400 mb-3">Errori immagini ({result.imageErrors.length})</h3>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {result.imageErrors.map((err, i) => (
                    <p key={i} className="text-xs text-zinc-400 font-mono">{err}</p>
                  ))}
                </div>
              </div>
            )}

            {result.debug && result.debug.length > 0 && (
              <details className="rounded-lg border border-zinc-800 p-6">
                <summary className="text-sm font-medium text-zinc-400 cursor-pointer hover:text-white">
                  Debug info ({result.debug.length} entries)
                </summary>
                <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
                  {result.debug.map((line, i) => (
                    <p key={i} className="text-xs text-zinc-500 font-mono">{line}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
