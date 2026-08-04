'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, LogOut, Play, Search } from 'lucide-react'
import {
  deleteProduct,
  getOrders,
  getOverview,
  logout,
  runQuery,
  runSync,
  searchProducts,
  updateOrderStatus,
  updateProduct,
  type OrderDTO,
  type OverviewData,
  type ProductDTO,
  type SyncFilters,
} from './actions'

type Tab = 'overview' | 'products' | 'orders' | 'sync' | 'sql'

const STATUS_LABELS: Record<string, string> = {
  listed: 'Disponibile',
  hold: 'In Attesa',
  sold: 'Venduto',
  pending: 'In Attesa pagamento',
  paid: 'Pagato',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const STATUS_COLORS: Record<string, string> = {
  listed: 'text-green-400',
  hold: 'text-amber-400',
  sold: 'text-zinc-400',
  pending: 'text-amber-400',
  paid: 'text-sky-400',
  shipped: 'text-violet-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/70 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-zinc-50">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  )
}

interface RowDraft {
  storePrice: string
  compareAtPrice: string
  quantity: string
  status: string
  isVisible: boolean
  featured: boolean
}

function ProductsTab() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef(query)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await searchProducts(q)
      setProducts(res)
    } catch {
      setError('Errore nel caricamento prodotti')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load('')
  }, [load])

  const draft = (p: ProductDTO): RowDraft =>
    drafts[p.id] ?? {
      storePrice: p.storePrice != null ? String(p.storePrice) : '',
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
      quantity: String(p.quantity ?? 0),
      status: p.status,
      isVisible: p.isVisible,
      featured: p.featured ?? false,
    }

  const setField = (id: string, field: keyof RowDraft, value: string | boolean) => {
    const base = products.find((p) => p.id === id)
    if (!base) return
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? draft(base)), [field]: value },
    }))
  }

  const handleSave = async (id: string) => {
    const base = products.find((p) => p.id === id)
    const d = drafts[id]
    if (!base || !d) return
    setSaving((s) => ({ ...s, [id]: true }))
    setMessage(null)
    setError(null)
    try {
      await updateProduct(id, {
        storePrice: d.storePrice === '' ? null : Number(d.storePrice),
        compareAtPrice: d.compareAtPrice === '' ? null : Number(d.compareAtPrice),
        quantity: Number(d.quantity) || 0,
        status: d.status,
        isVisible: d.isVisible,
        featured: d.featured,
      })
      const res = await searchProducts(searchRef.current)
      setProducts(res)
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setMessage('Prodotto aggiornato')
    } catch {
      setError('Errore durante il salvataggio')
    } finally {
      setSaving((s) => ({ ...s, [id]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare definitivamente questo prodotto?')) return
    try {
      await deleteProduct(id)
      setProducts((p) => p.filter((x) => x.id !== id))
      setMessage('Prodotto eliminato')
    } catch {
      setError('Errore durante l\'eliminazione')
    }
  }

  const isDirty = (p: ProductDTO) => {
    const d = drafts[p.id]
    if (!d) return false
    return (
      d.storePrice !== String(p.storePrice ?? '') ||
      d.compareAtPrice !== String(p.compareAtPrice ?? '') ||
      d.quantity !== String(p.quantity ?? 0) ||
      d.status !== p.status ||
      d.isVisible !== p.isVisible ||
      d.featured !== (p.featured ?? false)
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              searchRef.current = e.target.value
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') load(query)
            }}
            placeholder="Cerca per titolo, itemId o descrizione..."
            className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
          />
        </div>
        <button
          onClick={() => load(query)}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
        >
          Cerca
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Prodotto</th>
              <th className="px-4 py-3">Prezzo (€)</th>
              <th className="px-4 py-3">Prezzo barrato</th>
              <th className="px-4 py-3">Qtà</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Visibile</th>
              <th className="px-4 py-3">In evidenza</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  Caricamento...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  Nessun prodotto trovato
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const d = draft(p)
                return (
                  <tr key={p.id} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-100">{p.title}</p>
                      <p className="text-xs text-zinc-500">{p.itemId || p.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={d.storePrice}
                        onChange={(e) => setField(p.id, 'storePrice', e.target.value)}
                        className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-50 outline-none focus:border-[var(--accent)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={d.compareAtPrice}
                        onChange={(e) => setField(p.id, 'compareAtPrice', e.target.value)}
                        className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-50 outline-none focus:border-[var(--accent)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={d.quantity}
                        onChange={(e) => setField(p.id, 'quantity', e.target.value)}
                        className="w-16 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-50 outline-none focus:border-[var(--accent)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.status}
                        onChange={(e) => setField(p.id, 'status', e.target.value)}
                        className={`rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-semibold outline-none ${STATUS_COLORS[d.status] ?? 'text-zinc-100'}`}
                      >
                        <option value="listed">Disponibile</option>
                        <option value="hold">In Attesa</option>
                        <option value="sold">Venduto</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setField(p.id, 'isVisible', !d.isVisible)}
                        aria-label="Toggle visibilità"
                        className={`relative h-6 w-11 rounded-full transition ${d.isVisible ? 'bg-[var(--accent)]' : 'bg-zinc-700'}`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-50 transition-all ${d.isVisible ? 'left-[22px]' : 'left-0.5'}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setField(p.id, 'featured', !d.featured)}
                        aria-label="Toggle in evidenza"
                        className={`relative h-6 w-11 rounded-full transition ${d.featured ? 'bg-[var(--accent)]' : 'bg-zinc-700'}`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-50 transition-all ${d.featured ? 'left-[22px]' : 'left-0.5'}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(p.id)}
                          disabled={!isDirty(p) || saving[p.id]}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-40"
                        >
                          {saving[p.id] ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg border border-red-500/50 px-2 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setOrders(await getOrders())
    } catch {
      setError('Errore nel caricamento ordini')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatus = async (id: string, status: string) => {
    try {
      const updated = await updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
    } catch {
      setError('Errore durante l\'aggiornamento')
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Ordine</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Articoli</th>
              <th className="px-4 py-3">Totale</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Caricamento...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Nessun ordine
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-semibold text-zinc-100">{o.orderId || o.id}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(o.createdAt).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{o.email || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{o.itemCount}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-100">{euro.format(o.total || 0)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatus(o.id, e.target.value)}
                      className={`rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-semibold outline-none ${STATUS_COLORS[o.status] ?? 'text-zinc-100'}`}
                    >
                      <option value="pending">In Attesa pagamento</option>
                      <option value="paid">Pagato</option>
                      <option value="shipped">Spedito</option>
                      <option value="delivered">Consegnato</option>
                      <option value="cancelled">Annullato</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SyncTab() {
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState<SyncFilters>({
    skipSold: true,
    skipHold: false,
    onlyWithImage: false,
    onlyListed: false,
  })
  const [result, setResult] = useState<Awaited<ReturnType<typeof runSync>> | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    setLastSync(localStorage.getItem('dcc-dash-last-sync'))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await runSync(filters)
      setResult(res)
      if (res.success) {
        const now = new Date().toLocaleString('it-IT')
        localStorage.setItem('dcc-dash-last-sync', now)
        setLastSync(now)
      }
    } catch {
      setResult({ success: false, error: 'Errore durante la sincronizzazione' })
    } finally {
      setSyncing(false)
    }
  }

  const toggle = (key: keyof SyncFilters) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }))

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-50">Sincronizza inventario</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Importa prodotti, categorie, collezioni e immagini dal foglio Google. {lastSync ? `Ultima sincronizzazione: ${lastSync}.` : ''}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['skipSold', 'Salta i prodotti venduti'],
            ['skipHold', 'Salta i prodotti in attesa'],
            ['onlyWithImage', 'Solo prodotti con immagine'],
            ['onlyListed', 'Solo prodotti listati'],
          ] as [keyof SyncFilters, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={() => toggle(key)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {label}
          </label>
        ))}
      </div>

      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
      >
        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {syncing ? 'Sincronizzazione...' : 'Avvia sincronizzazione'}
      </button>

      {result ? (
        <div className={`rounded-xl border-2 p-4 text-sm ${result.success ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
          {result.success ? (
            <div className="space-y-1 text-zinc-200">
              <p className="font-bold text-green-400">Sincronizzazione completata</p>
              <p>Righe totali: {result.totalRows} · Saltate: {result.skipped} · Filtrate: {result.filteredOut}</p>
              <p>Prodotti creati: {result.productsCreated} · Aggiornati: {result.productsUpdated}</p>
              <p>Categorie: {result.categories} · Collezioni: {result.collections} · Immagini: {result.imagesUploaded}</p>
              {result.imageErrors && result.imageErrors.length > 0 ? (
                <p className="text-amber-400">Errori immagini: {result.imageErrors.length}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1 text-zinc-200">
              <p className="font-bold text-red-400">{result.error || 'Errore'}</p>
              {result.details ? <p className="text-xs text-zinc-400">{result.details}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function SqlTab() {
  const [sql, setSql] = useState('')
  const [running, setRunning] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [timeMs, setTimeMs] = useState(0)
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    if (!sql.trim() || running) return
    setRunning(true)
    setError(null)
    try {
      const res = await runQuery(sql)
      if (res.error) {
        setError(res.error)
        setColumns([])
        setRows([])
      } else {
        setColumns(res.columns)
        setRows(res.rows)
        setRowCount(res.rowCount)
        setTimeMs(res.timeMs)
        setTruncated(res.truncated)
      }
    } catch {
      setError('Errore durante l\'esecuzione della query')
      setColumns([])
      setRows([])
    } finally {
      setRunning(false)
    }
  }

  const formatCell = (v: unknown): string => {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-50">Query SQL</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Interroga il database in sola lettura per vedere i dati raw. Solo SELECT, SHOW, EXPLAIN e WITH.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleRun()
            }
          }}
          placeholder="SELECT * FROM products LIMIT 50;"
          spellCheck={false}
          className="h-32 w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={handleRun}
          disabled={running || !sql.trim()}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Esecuzione...' : 'Esegui'}
        </button>
        <p className="text-xs text-zinc-600">Scorciatoia: Ctrl + Invio</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      ) : null}

      {columns.length > 0 ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{rowCount} righe</span>
            <span>·</span>
            <span>{timeMs} ms</span>
            {truncated ? (
              <span className="text-amber-400">· risultato troncato a 500 righe</span>
            ) : null}
          </div>
          <div className="max-h-[480px] overflow-auto rounded-xl border-2 border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-900 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="whitespace-nowrap border-b border-zinc-800 px-3 py-2">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-900/50">
                    {columns.map((c) => (
                      <td key={c} className="whitespace-nowrap px-3 py-1.5 font-mono text-zinc-300">
                        {formatCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function DashboardMain() {
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await getOverview())
    } catch {
      setError('Errore nel caricamento dei dati')
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Panoramica' },
    { key: 'products', label: 'Prodotti' },
    { key: 'orders', label: 'Ordini' },
    { key: 'sync', label: 'Sincronizzazione' },
    { key: 'sql', label: 'SQL' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Area Riservata</p>
          <h1 className="text-3xl font-black text-zinc-50">Dashboard</h1>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 rounded-lg border-2 border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-red-500/50 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" /> Esci
        </button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
              tab === t.key
                ? 'border-2 border-b-0 border-zinc-800 bg-zinc-900 text-[var(--accent)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      ) : null}

      <div className="mt-6">
        {tab === 'overview' ? (
          overview ? (
            <div className="space-y-8">
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">Inventario</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard label="Totale" value={overview.products.total} />
                  <StatCard label="Disponibili" value={overview.products.listed} />
                  <StatCard label="In Attesa" value={overview.products.hold} />
                  <StatCard label="Venduti" value={overview.products.sold} />
                  <StatCard label="Visibili" value={overview.products.visible} />
                  <StatCard label="Stock basso" value={overview.products.lowStock} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatCard label="Valore inventario" value={euro.format(overview.inventoryValue)} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">Ordini</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard label="Totale" value={overview.orders.total} />
                  <StatCard label="Da pagare" value={overview.orders.pending} />
                  <StatCard label="Pagati" value={overview.orders.paid} />
                  <StatCard label="Spediti" value={overview.orders.shipped} />
                  <StatCard label="Consegnati" value={overview.orders.delivered} />
                  <StatCard label="Annullati" value={overview.orders.cancelled} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatCard label="Fatturato (pagato/spedito/consegnato)" value={euro.format(overview.revenue)} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">Ultimi ordini</h2>
                <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Ordine</th>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Articoli</th>
                        <th className="px-4 py-3">Totale</th>
                        <th className="px-4 py-3">Stato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
                      {overview.recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-zinc-900/50">
                          <td className="px-4 py-3 font-semibold text-zinc-100">{o.orderId || o.id}</td>
                          <td className="px-4 py-3 text-zinc-400">
                            {new Date(o.createdAt).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{o.itemCount}</td>
                          <td className="px-4 py-3 font-semibold text-zinc-100">{euro.format(o.total || 0)}</td>
                          <td className={`px-4 py-3 font-semibold ${STATUS_COLORS[o.status] ?? 'text-zinc-100'}`}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </td>
                        </tr>
                      ))}
                      {overview.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                            Nessun ordine
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <p className="text-zinc-500">Caricamento...</p>
          )
        ) : null}
        {tab === 'products' ? <ProductsTab /> : null}
        {tab === 'orders' ? <OrdersTab /> : null}
        {tab === 'sync' ? <SyncTab /> : null}
        {tab === 'sql' ? <SqlTab /> : null}
      </div>
    </div>
  )
}
