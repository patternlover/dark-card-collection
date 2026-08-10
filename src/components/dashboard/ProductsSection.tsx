'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import {
  getCategories,
  getCollections,
  searchProducts,
  type CategoryOption,
  type CollectionOption,
  type ProductDTO,
} from '@/app/dashboard/actions'
import { groupProducts } from '@/lib/group-products'
import { ProductGroupRow } from '@/components/dashboard/ProductGroupRow'
import { CreateProductModal } from '@/components/dashboard/CreateProductModal'

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'listed', label: 'Disponibile' },
  { value: 'hold', label: 'In Attesa' },
  { value: 'sold', label: 'Venduto' },
]

const IMAGE_OPTIONS = [
  { value: '', label: 'Tutte le immagini' },
  { value: 'yes', label: 'Con immagine' },
  { value: 'no', label: 'Senza immagine' },
]

const PAGE_SIZE = 25

export function ProductsSection() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [collection, setCollection] = useState('')
  const [withImage, setWithImage] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(
    async (opts: { page?: number; search?: string } = {}) => {
      setLoading(true)
      try {
        const res = await searchProducts({
          search: opts.search ?? query,
          status: status || undefined,
          category: category || undefined,
          collection: collection || undefined,
          withImage: withImage || undefined,
          limit: PAGE_SIZE,
          page: opts.page ?? page,
        })
        setProducts(res.docs)
        setTotal(res.total)
        setTotalPages(Math.max(1, res.totalPages))
      } catch {
        setMessage({ text: 'Errore nel caricamento prodotti', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [query, status, category, collection, withImage, page],
  )

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getCollections().then(setCollections).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const groups = useMemo(() => groupProducts(products), [products])

  const patchProduct = useCallback((id: string, patch: Partial<ProductDTO>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const removeProducts = useCallback((ids: string[]) => {
    const set = new Set(ids)
    setProducts((prev) => {
      const removed = prev.filter((p) => set.has(p.id)).length
      if (removed > 0) setTotal((t) => Math.max(0, t - removed))
      return prev.filter((p) => !set.has(p.id))
    })
  }, [])

  const runSearch = () => {
    setPage(1)
    load({ page: 1, search: query })
  }

  const changeFilter = (setter: (v: string) => void, value: string) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black text-zinc-50">Prodotti</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {total} prodotti · raggruppati per titolo ({groups.length} gruppi)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
            placeholder="Cerca per titolo, item_group_id o descrizione..."
            className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => changeFilter(setStatus, e.target.value)}
          className="rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => changeFilter(setCategory, e.target.value)}
          className="rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={collection}
          onChange={(e) => changeFilter(setCollection, e.target.value)}
          className="rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
        >
          <option value="">Tutte le collezioni</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={withImage}
          onChange={(e) => changeFilter(setWithImage, e.target.value)}
          className="rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
        >
          {IMAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={runSearch}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
        >
          Cerca
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuovo Prodotto
        </button>
      </div>

      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === 'error'
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-green-500/40 bg-green-500/10 text-green-400'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Caricamento...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-zinc-500">Nessun prodotto trovato</p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <ProductGroupRow
              key={g.title}
              group={g}
              categories={categories}
              collections={collections}
              onPatch={patchProduct}
              onRemove={removeProducts}
              onChanged={() => load()}
              onNotify={notify}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t-2 border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500">
            Pagina {page} di {totalPages} · {total} prodotti
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Precedente
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Successiva <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <CreateProductModal
          categories={categories}
          collections={collections}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            notify('Prodotto creato')
            load()
          }}
          onError={(msg) => notify(msg, 'error')}
        />
      ) : null}
    </div>
  )
}
