'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Plus, Search } from 'lucide-react'
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
import { ProductTable } from '@/components/dashboard/ProductTable'
import { CreateProductModal } from '@/components/dashboard/CreateProductModal'
import {
  Alert,
  Button,
  Input,
  PageHeader,
  Select,
  TogglePills,
  Toolbar,
} from './ui'

type ProductView = 'table' | 'cards'

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
const VIEW_STORAGE_KEY = 'dash:products:view'

function initialView(): ProductView {
  if (typeof window === 'undefined') return 'table'
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === 'cards' || stored === 'table' ? stored : 'table'
}

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
  const [view, setView] = useState<ProductView>(initialView)

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view)
  }, [view])

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

  const renderExtraFilters = false

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prodotti"
        description={`${total} prodotti · raggruppati per titolo (${groups.length} gruppi)`}
      >
        <TogglePills<ProductView>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', label: <><LayoutList className="h-3.5 w-3.5" /> Tabella</>, title: 'Vista tabella compatta' },
            { value: 'cards', label: <><LayoutGrid className="h-3.5 w-3.5" /> Card</>, title: 'Vista a card' },
          ]}
        />
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nuovo Prodotto
        </Button>
      </PageHeader>

      <Toolbar>
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
            placeholder="Cerca per titolo, item_group_id o descrizione..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => changeFilter(setStatus, e.target.value)}
          className="w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {renderExtraFilters ? (
          <>
            <Select
              value={category}
              onChange={(e) => changeFilter(setCategory, e.target.value)}
              className="w-auto"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              value={collection}
              onChange={(e) => changeFilter(setCollection, e.target.value)}
              className="w-auto"
            >
              <option value="">Tutte le collezioni</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              value={withImage}
              onChange={(e) => changeFilter(setWithImage, e.target.value)}
              className="w-auto"
            >
              {IMAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </>
        ) : null}
        <Button variant="secondary" onClick={runSearch}>
          Cerca
        </Button>
      </Toolbar>

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun prodotto trovato</p>
      ) : view === 'table' ? (
        <ProductTable
          groups={groups}
          categories={categories}
          collections={collections}
          onPatch={patchProduct}
          onRemove={removeProducts}
          onChanged={() => load()}
          onNotify={notify}
        />
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
        <div className="flex items-center justify-between border-t border-[var(--ui-border)] pt-4">
          <p className="text-xs text-[var(--ui-text-muted)]">
            Pagina {page} di {totalPages} · {total} prodotti
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" /> Precedente
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Successiva <ChevronRight className="h-4 w-4" />
            </Button>
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
