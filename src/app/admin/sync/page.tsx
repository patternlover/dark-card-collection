'use client'

import { useState } from 'react'
import { syncInventory } from './actions'

interface SyncResult {
  success?: boolean
  categories?: number
  collections?: number
  productsCreated?: number
  productsUpdated?: number
  imagesUploaded?: number
  skipped?: number
  error?: string
  details?: string
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)

    try {
      const data = await syncInventory()
      setResult(data)
      if (data.success) {
        setLastSync(new Date().toLocaleString('it-IT'))
      }
    } catch (err) {
      setResult({ error: 'Failed to connect', details: String(err) })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Sincronizzazione Inventario</h1>
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
          <div className="mt-8 rounded-lg border border-zinc-800 p-6">
            {result.success ? (
              <div>
                <h2 className="text-lg font-semibold text-green-400 mb-4">✓ Completato</h2>
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
                    <span className="font-medium">{result.imagesUploaded || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Righe saltate:</span>{' '}
                    <span className="font-medium">{result.skipped || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-red-400 mb-2">✗ Errore</h2>
                <p className="text-sm text-zinc-400">{result.error}</p>
                {result.details && (
                  <p className="mt-2 text-xs text-zinc-600">{result.details}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
