'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
  filteredOut?: number
  totalRows?: number
  imageErrors?: string[]
  debug?: string[]
  error?: string
  details?: string
}

interface SyncFilters {
  skipSold: boolean
  skipHold: boolean
  onlyWithImage: boolean
  onlyListed: boolean
}

export default function SyncPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [filters, setFilters] = useState<SyncFilters>({
    skipSold: true,
    skipHold: false,
    onlyWithImage: false,
    onlyListed: false,
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(false)
    setAuthenticated(true)
  }

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)

    try {
      const data = await syncInventory(password, filters)
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

  const toggleFilter = (key: keyof SyncFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
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
            className="w-full border-2 border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#FACC15] focus:outline-none shadow-[3px_3px_0px_0px_#27272a]"
            autoFocus
          />
          {authError && (
            <p className="text-sm text-red-400">Password non valida</p>
          )}
          <button
            type="submit"
            className="w-full border-2 border-[#FACC15] bg-[#FACC15] px-4 py-3 font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-0 active:shadow-none"
          >
            Accedi
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#FACC15] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Sincronizzazione Inventario</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Esci
          </Link>
        </div>
        <p className="text-zinc-400 mb-8">
          Importa e aggiorna i prodotti dal Google Sheet
        </p>

        <div className="border-2 border-zinc-800 p-6 mb-6 shadow-[3px_3px_0px_0px_#27272a]">
          <h2 className="text-sm font-bold text-zinc-300 mb-4">Filtri Import</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'skipSold' as const, label: 'Escludi SOLD', desc: 'Non importare prodotti venduti' },
              { key: 'skipHold' as const, label: 'Escludi HOLD', desc: 'Non importare prodotti in attesa' },
              { key: 'onlyWithImage' as const, label: 'Solo con immagine', desc: 'Solo prodotti con image_url' },
              { key: 'onlyListed' as const, label: 'Solo disponibili', desc: 'Solo stati disponibili' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => toggleFilter(key)}
                  className="mt-1 h-4 w-4 border-2 border-zinc-600 bg-zinc-800 accent-[#FACC15]"
                />
                <div>
                  <span className="text-sm text-zinc-300 group-hover:text-white transition-colors font-medium">{label}</span>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="border-2 border-[#FACC15] bg-[#FACC15] px-6 py-3 font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-0 disabled:hover:shadow-[3px_3px_0px_0px_#000]"
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
              <div className="border-2 border-zinc-800 p-6 shadow-[3px_3px_0px_0px_#27272a]">
                <h2 className="text-lg font-bold text-green-400 mb-4">Completato</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Righe totali:</span>{' '}
                    <span className="font-bold">{result.totalRows || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Filtrate fuori:</span>{' '}
                    <span className="font-bold">{result.filteredOut || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Categorie create:</span>{' '}
                    <span className="font-bold">{result.categories || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Collezioni create:</span>{' '}
                    <span className="font-bold">{result.collections || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Prodotti creati:</span>{' '}
                    <span className="font-bold">{result.productsCreated || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Prodotti aggiornati:</span>{' '}
                    <span className="font-bold">{result.productsUpdated || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Con immagine:</span>{' '}
                    <span className={`font-bold ${result.imagesUploaded === 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {result.imagesUploaded || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Righe saltate:</span>{' '}
                    <span className="font-bold">{result.skipped || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-red-800 p-6 shadow-[3px_3px_0px_0px_#7f1d1d]">
                <h2 className="text-lg font-bold text-red-400 mb-2">Errore</h2>
                <p className="text-sm text-zinc-400">{result.error}</p>
                {result.details && (
                  <pre className="mt-2 text-xs text-zinc-600 whitespace-pre-wrap">{result.details}</pre>
                )}
              </div>
            )}

            {result.imageErrors && result.imageErrors.length > 0 && (
              <div className="border-2 border-red-800 p-6 shadow-[3px_3px_0px_0px_#7f1d1d]">
                <h3 className="text-sm font-bold text-red-400 mb-3">Errori immagini ({result.imageErrors.length})</h3>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {result.imageErrors.map((err, i) => (
                    <p key={i} className="text-xs text-zinc-400 font-mono">{err}</p>
                  ))}
                </div>
              </div>
            )}

            {result.debug && result.debug.length > 0 && (
              <details className="border-2 border-zinc-800 p-6 shadow-[3px_3px_0px_0px_#27272a]">
                <summary className="text-sm font-bold text-zinc-400 cursor-pointer hover:text-white">
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
