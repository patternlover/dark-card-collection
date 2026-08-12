'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Search, Star } from 'lucide-react'
import {
  getCategories,
  getCollections,
  searchProducts,
  updateProduct,
  type CategoryOption,
  type CollectionOption,
  type ProductDTO,
} from '@/app/dashboard/actions'
import { EditProductModal } from '@/components/dashboard/EditProductModal'
import { StatusBadge } from './productShared'
import {
  Alert,
  Button,
  Input,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Toolbar,
  Tr,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'listed', label: 'Disponibile' },
  { value: 'hold', label: 'In Attesa' },
  { value: 'sold', label: 'Venduto' },
]

const PAGE_SIZE = 25

function iconButtonClass() {
  return 'rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]'
}

export function ListingsSection() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    async (opts: { page?: number; search?: string } = {}) => {
      setLoading(true)
      try {
        const res = await searchProducts({
          search: opts.search ?? query,
          status: status || undefined,
          limit: PAGE_SIZE,
          page: opts.page ?? page,
        })
        setProducts(res.docs)
        setTotal(res.total)
        setTotalPages(Math.max(1, res.totalPages))
      } catch {
        setMessage({ text: 'Errore nel caricamento del listino', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [query, status, page],
  )

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getCollections().then(setCollections).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const runSearch = () => {
    setPage(1)
    load({ page: 1, search: query })
  }

  const toggleVisibility = async (p: ProductDTO) => {
    const target = p.isVisible !== false ? false : true
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isVisible: target } : x)))
    setBusy(true)
    try {
      const saved = await updateProduct(p.id, { isVisible: target })
      setProducts((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))
      notify(target ? 'Prodotto visibile nello shop' : 'Prodotto nascosto dallo shop')
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), 'error')
      load()
    } finally {
      setBusy(false)
    }
  }

  const toggleFeatured = async (p: ProductDTO) => {
    const target = !p.featured
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: target } : x)))
    setBusy(true)
    try {
      const saved = await updateProduct(p.id, { featured: target })
      setProducts((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))
      notify(target ? 'Prodotto in vetrina' : 'Prodotto rimosso dalla vetrina')
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), 'error')
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Listino"
        description={`${total} prodotti · prezzo, stato e visibilità sullo shop`}
      />

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
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Button variant="secondary" onClick={runSearch}>
          Cerca
        </Button>
      </Toolbar>

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun prodotto in listino</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Prodotto</Th>
              <Th>Prezzo</Th>
              <Th>Barrato</Th>
              <Th>Stato</Th>
              <Th>Disponibilità</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="max-w-[260px] truncate font-medium text-[var(--ui-text)]">{p.title}</span>

                    {p.featured ? (
                      <Star className="h-3.5 w-3.5 fill-[var(--ui-accent)] text-[var(--ui-accent)]" aria-label="In vetrina" />
                    ) : null}
                  </div>
                </Td>
                <Td className="font-semibold text-[var(--ui-text)]">{p.price != null ? euro.format(p.price) : '—'}</Td>
                <Td className="text-[var(--ui-text-muted)]">
                  {p.salePrice != null && p.salePrice > 0 ? (
                    <span className="line-through">{euro.format(p.salePrice)}</span>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td><StatusBadge status={p.status || 'listed'} /></Td>
                <Td className="text-[var(--ui-text-muted)]">{p.availability || '—'}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleFeatured(p)}
                      disabled={busy}
                      title={p.featured ? 'Togli dalla vetrina' : 'Metti in vetrina (bestseller)'}
                      className={iconButtonClass()}
                    >
                      <Star className={`h-3.5 w-3.5 ${p.featured ? 'fill-[var(--ui-accent)] text-[var(--ui-accent)]' : ''}`} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleVisibility(p)}
                      disabled={busy}
                      title={p.isVisible !== false ? 'Nascondi dallo shop' : 'Mostra nello shop'}
                      className={iconButtonClass()}
                    >
                      {p.isVisible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing(p)}
                      disabled={busy}
                      title="Modifica"
                      className={iconButtonClass()}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
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

      {editing ? (
        <EditProductModal
          product={editing}
          categories={categories}
          collections={collections}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setProducts((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))
            setEditing(null)
            notify('Prodotto salvato')
          }}
          onError={(msg) => notify(msg, 'error')}
        />
      ) : null}
    </div>
  )
}
