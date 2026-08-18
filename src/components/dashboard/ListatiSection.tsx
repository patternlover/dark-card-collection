'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Star,
} from 'lucide-react'
import {
  getProductById,
  searchListings,
  updateGroup,
  type ProductDTO,
} from '@/app/dashboard/actions'
import type { ListingGroup } from '@/lib/listings'
import { EditProductModal } from '@/components/dashboard/EditProductModal'
import { Badge } from './ui'
import {
  Alert,
  Button,
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

function iconButtonClass() {
  return 'p-1.5 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]'
}

function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === 'in_stock') return <Badge tone="success">In stock</Badge>
  if (availability === 'out_of_stock') return <Badge tone="danger">Esaurito</Badge>
  return <Badge tone="warning">Preordine</Badge>
}

export function ListatiSection() {
  const { sortBy, sortDir, handleSort } = useSort('title')
  const onSort = (field: string) => {
    setPage(1)
    handleSort(field)
  }
  const [groups, setGroups] = useState<ListingGroup[]>([])
  const [featuredCount, setFeaturedCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    async (opts: { page?: number } = {}) => {
      setLoading(true)
      const pageNum = opts.page ?? page
      try {
        const res = await searchListings({
          sortBy,
          sortDir,
          limit: PAGE_SIZE,
          page: pageNum,
        })
        if (res.error) {
          setMessage({ text: res.error, type: 'error' })
          return
        }
        setGroups(res.groups)
        setFeaturedCount(res.featuredCount)
        setTotal(res.total)
        setTotalPages(Math.max(1, res.totalPages))
      } catch {
        setMessage({ text: 'Errore nel caricamento dei listati', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [sortBy, sortDir, page],
  )

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const applyGroupPatch = (title: string, patch: { isVisible?: boolean; featured?: boolean }) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.title !== title) return g
        const variants = g.variants.map((v) => ({
          ...v,
          isVisible: patch.isVisible !== undefined ? patch.isVisible : v.isVisible,
          featured: patch.featured !== undefined ? patch.featured : v.featured,
        }))
        return {
          ...g,
          variants,
          visible: variants.some((v) => v.isVisible),
          hidden: variants.every((v) => !v.isVisible),
          featured: variants.some((v) => v.featured),
        }
      }),
    )
  }

  const toggleVisibility = async (g: ListingGroup) => {
    const target = g.visible ? false : true
    applyGroupPatch(g.title, { isVisible: target })
    setBusy(true)
    try {
      const res = await updateGroup(g.title, { isVisible: target })
      if (!res.ok) {
        notify(res.message || 'Errore durante l\'aggiornamento', 'error')
        load()
        return
      }
      notify(target ? 'Gruppo visibile nello shop' : 'Gruppo nascosto dallo shop')
      load()
    } catch {
      notify('Errore durante l\'aggiornamento del gruppo', 'error')
      load()
    } finally {
      setBusy(false)
    }
  }

  const toggleFeatured = async (g: ListingGroup) => {
    const target = !g.featured
    applyGroupPatch(g.title, { featured: target })
    setBusy(true)
    try {
      const res = await updateGroup(g.title, { featured: target })
      if (!res.ok) {
        notify(res.message || 'Errore durante l\'aggiornamento', 'error')
        load()
        return
      }
      notify(target ? 'Gruppo in vetrina' : 'Gruppo rimosso dalla vetrina')
      load()
    } catch {
      notify('Errore durante l\'aggiornamento del gruppo', 'error')
      load()
    } finally {
      setBusy(false)
    }
  }

  const openEdit = async (variantId: string) => {
    setBusy(true)
    try {
      const product = await getProductById(variantId)
      setEditing(product)
    } catch {
      notify('Errore durante il caricamento del prodotto', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onSaved = (saved: ProductDTO) => {
    setEditing(null)
    notify('Prodotto salvato')
    load()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Listati"
        description={`${total} gruppi (per nome prodotto) · In evidenza ${featuredCount}/4 · prezzo, costo medio, quantità e disponibilità`}
      />

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun gruppo nei listati</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <SortableTh label="Prodotto" field="title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Qty" field="quantity" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Venduti" field="sold" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Disponibilità" field="availability" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Costo medio" field="cost" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Prezzo" field="price" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {groups.map((g) => (
              <Tr key={g.title}>
                <Td>
                  <span className="block truncate font-medium text-[var(--ui-text)]" title={g.title}>
                    {g.title}
                  </span>
                </Td>
                <Td className="font-semibold text-[var(--ui-text)]">{g.totalQuantity}</Td>
                <Td className="text-[var(--ui-text-muted)]">
                  <span className="font-medium text-[var(--ui-text)]">{g.totalSold}</span>
                </Td>
                <Td><AvailabilityBadge availability={g.availability} /></Td>
                <Td className="whitespace-nowrap text-[var(--ui-text-muted)]">{g.cost != null ? euro.format(g.cost) : '—'}</Td>
                <Td className="font-semibold text-[var(--ui-text)]">{g.price != null ? euro.format(g.price) : '—'}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleFeatured(g)}
                      disabled={busy || (!g.featured && featuredCount >= 4)}
                      title={
                        !g.featured && featuredCount >= 4
                          ? 'Slot in evidenza pieni (4/4)'
                          : g.featured
                            ? 'Togli dalla vetrina'
                            : 'Metti in vetrina (bestseller)'
                      }
                      className={iconButtonClass()}
                    >
                      <Star className={`h-3.5 w-3.5 ${g.featured ? 'fill-[var(--ui-accent)] text-[var(--ui-accent)]' : ''}`} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleVisibility(g)}
                      disabled={busy}
                      title={g.visible ? 'Nascondi dallo shop (tutte le varianti)' : 'Mostra nello shop (tutte le varianti)'}
                      className={iconButtonClass()}
                    >
                      {g.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(g.variants[0].id)}
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
            Pagina {page} di {totalPages} · {total} gruppi
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
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onError={(msg) => notify(msg, 'error')}
        />
      ) : null}
    </div>
  )
}
