'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import {
  deleteProduct,
  getCategories,
  getCollections,
  getPurchaseHistory,
  searchProducts,
  type CategoryOption,
  type CollectionOption,
  type ProductDTO,
  type PurchaseHistoryEntry,
} from '@/app/dashboard/actions'
import { CreateProductModal } from '@/components/dashboard/CreateProductModal'
import { StatusBadge } from './productShared'
import { Trash2 } from 'lucide-react'
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

export function InventorySection() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, PurchaseHistoryEntry[]>>({})
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getCollections().then(setCollections).catch(() => {})
  }, [])

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
        setMessage({ text: 'Errore nel caricamento inventario', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [query, status, page],
  )

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const runSearch = () => {
    setPage(1)
    load({ page: 1, search: query })
  }

  const toggleHistory = async (product: ProductDTO) => {
    if (expandedId === product.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(product.id)
    if (history[product.id] === undefined) {
      try {
        const entries = await getPurchaseHistory(product.id)
        setHistory((prev) => ({ ...prev, [product.id]: entries }))
      } catch {
        setHistory((prev) => ({ ...prev, [product.id]: [] }))
      }
    }
  }

  const removeProduct = async (product: ProductDTO) => {
    if (!confirm(`Eliminare definitivamente "${product.title}"?`)) return
    setBusy(true)
    try {
      await deleteProduct(product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setHistory((prev) => {
        const next = { ...prev }
        delete next[product.id]
        return next
      })
      notify('Prodotto eliminato')
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
        title="Magazzino"
        description={`${total} prodotti · stock, costo medio e storico acquisti`}
      >
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
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun prodotto in inventario</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Prodotto</Th>
              <Th>Stock</Th>
              <Th>Costo medio</Th>
              <Th>Prezzo</Th>
              <Th>Valore inventario</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {products.map((p) => {
              const expanded = expandedId === p.id
              const inventoryValue = (Number(p.price) || 0) * (Number(p.quantity) || 0)
              return (
                <>
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="max-w-[260px] truncate font-medium text-[var(--ui-text)]">{p.title}</span>
                        <StatusBadge status={p.status || 'listed'} />
                      </div>
                    </Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{p.quantity ?? 0}</Td>
                    <Td className="text-[var(--ui-text-muted)]">{p.costOfGoodsSold != null ? euro.format(p.costOfGoodsSold) : '—'}</Td>
                    <Td className="text-[var(--ui-text-muted)]">{p.price != null ? euro.format(p.price) : '—'}</Td>
                    <Td className="font-medium text-[var(--ui-text)]">{euro.format(inventoryValue)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleHistory(p)}
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                          title="Storico acquisti"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeProduct(p)}
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                          title="Elimina prodotto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                  {expanded ? (
                    <Tr key={`${p.id}-detail`}>
                      <Td colSpan={6} className="p-0">
                        <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
                            Storico acquisti
                          </p>
                          {!history[p.id] ? (
                            <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
                          ) : history[p.id].length === 0 ? (
                            <p className="text-sm text-[var(--ui-text-muted)]">
                              Nessun lotto registrato per questo prodotto (costo manuale o dato legacy)
                            </p>
                          ) : (
                            <div className="divide-y divide-[var(--ui-border)]/80">
                              {history[p.id].map((h, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                                  <span className="w-24 text-xs text-[var(--ui-text-muted)]">
                                    {h.purchaseDate ? new Date(h.purchaseDate).toLocaleDateString('it-IT') : '—'}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-[var(--ui-text-muted)]">
                                    {h.sourceName || h.sourceType || 'Lotto #' + h.purchaseId}
                                  </span>
                                  <span className="text-xs text-[var(--ui-text-muted)]">qty {h.quantity}</span>
                                  <span className="text-xs text-[var(--ui-text-faint)]">costo eff. {euro.format(h.effectiveUnitCost)}</span>
                                  <span className="text-xs text-[var(--ui-text-muted)]">residuo {h.remainingQuantity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ) : null}
                </>
              )
            })}
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
