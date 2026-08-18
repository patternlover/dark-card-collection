'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import {
  deleteProduct,
  getPurchaseHistory,
  searchProducts,
  type ProductDTO,
  type PurchaseHistoryEntry,
} from '@/app/dashboard/actions'
import {
  Alert,
  Badge,
  Button,
  Input,
  PageHeader,
  SortableTh,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useSort,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const PAGE_SIZE = 25

function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === 'in_stock') return <Badge tone="success">In stock</Badge>
  if (availability === 'out_of_stock') return <Badge tone="danger">Esaurito</Badge>
  return <Badge tone="warning">Preordine</Badge>
}

export function InventorySection() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const { sortBy, sortDir, handleSort } = useSort('title')
  const onSort = (field: string) => {
    setPage(1)
    handleSort(field)
  }
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, PurchaseHistoryEntry[]>>({})
  const [busy, setBusy] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'product' | 'card'>('all')

  const load = useCallback(
    async (opts: { page?: number; search?: string } = {}) => {
      setLoading(true)
      try {
        const res = await searchProducts({
          search: appliedQuery,
          sortBy,
          sortDir,
          limit: 200,
          page: opts.page ?? page,
        })
        let filtered = res.docs
        if (categoryFilter !== 'all') {
          filtered = filtered.filter((p) => (p.itemCategory1 ?? 'product') === categoryFilter)
        }
        setProducts(filtered)
        setTotal(categoryFilter !== 'all' ? filtered.length : res.total)
        setTotalPages(Math.max(1, categoryFilter !== 'all' ? 1 : res.totalPages))
      } catch {
        setMessage({ text: 'Errore nel caricamento inventario', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [appliedQuery, sortBy, sortDir, page, categoryFilter],
  )

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

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
      const res = await deleteProduct(product.id)
      if (!res.ok) {
        notify(res.message || 'Errore durante l\'eliminazione del prodotto', 'error')
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setHistory((prev) => {
        const next = { ...prev }
        delete next[product.id]
        return next
      })
      notify('Prodotto eliminato')
    } catch {
      notify('Errore durante l\'eliminazione del prodotto', 'error')
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
      />

      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center overflow-hidden rounded-md border border-[var(--ui-border)]">
          {(['all', 'product', 'card'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => { setCategoryFilter(opt); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === opt
                  ? 'bg-[var(--ui-accent)] text-[var(--ui-accent-foreground)]'
                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'
              }`}
            >
              {opt === 'all' ? 'Tutti' : opt === 'product' ? 'Prodotti' : 'Carte'}
            </button>
          ))}
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedQuery(query.trim())
                setPage(1)
              }
            }}
            placeholder="Cerca per titolo..."
            className="pl-9"
          />
        </div>
      </div>

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun prodotto in inventario</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <SortableTh label="Prodotto" field="title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Stock" field="quantity" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Disponibilità" field="availability" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Costo medio" field="cost" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Prezzo" field="price" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {products.map((p) => {
              const expanded = expandedId === p.id
              return (
                <Fragment key={p.id}>
                  <Tr>
                    <Td>
                      <button
                        onClick={() => toggleHistory(p)}
                        className="flex items-center gap-3 text-left transition-colors hover:text-[var(--ui-accent-hover)]"
                      >
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[var(--ui-text-faint)] transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                        <span className="min-w-0 break-words font-medium text-[var(--ui-text)]">{p.title}</span>
                      </button>
                    </Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{p.quantity ?? 0}</Td>
                    <Td><AvailabilityBadge availability={p.availability ?? (p.quantity > 0 ? 'in_stock' : 'out_of_stock')} /></Td>
                    <Td className="text-[var(--ui-text-muted)]">{p.costOfGoodsSold != null && p.costOfGoodsSold > 0 ? euro.format(p.costOfGoodsSold) : '—'}</Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{p.price != null ? euro.format(p.price) : '—'}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(p)}
                          className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
                          title="Elimina prodotto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                  {expanded ? (
                    <Tr key={`${p.id}-detail`}>
                      <Td colSpan={5} className="p-0">
                        <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
                            Storico acquisti
                          </p>
                          {!history[p.id] ? (
                            <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
                          ) : history[p.id].length === 0 ? (
                            <p className="text-sm text-[var(--ui-text-muted)]">
                              Nessun lotto registrato per questo prodotto
                            </p>
                          ) : (
                            <div className="divide-y divide-[var(--ui-border)]/80">
                              {history[p.id].map((h, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                                  <span className="w-24 text-xs text-[var(--ui-text-muted)]">
                                    {h.purchaseDate ? new Date(h.purchaseDate).toLocaleDateString('it-IT') : '—'}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-[var(--ui-text-muted)]">
                                    {h.sourceName ? (
                                      <Link
                                        href={`/dashboard/purchases?search=${encodeURIComponent(h.sourceName)}`}
                                        className="text-[var(--ui-accent)] hover:underline"
                                      >
                                        {h.sourceName}
                                      </Link>
                                    ) : (
                                      h.sourceType || 'Lotto #' + h.purchaseId
                                    )}
                                  </span>
                                  <span className="text-xs text-[var(--ui-text-faint)]">costo {euro.format(h.effectiveUnitCost)}</span>
                                  <span className="text-xs text-[var(--ui-text-muted)]">residuo {h.remainingQuantity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ) : null}
                </Fragment>
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
    </div>
  )
}
