'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Search, Star } from 'lucide-react'
import {
  getCategories,
  getCollections,
  getProductById,
  searchListings,
  updateGroup,
  type CategoryOption,
  type CollectionOption,
  type ProductDTO,
} from '@/app/dashboard/actions'
import type { ListingGroup, ListingVariant } from '@/lib/listings'
import { EditProductModal } from '@/components/dashboard/EditProductModal'
import { StatusBadge } from './productShared'
import { Badge } from './ui'
import { GRADE_LABELS, LANGUAGE_LABELS } from './productShared'
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

const SALES_CHANNEL_LABELS: Record<string, string> = {
  website: 'Sito web',
  vinted: 'Vinted',
  ebay: 'eBay',
  cardmarket: 'Cardmarket',
  other: 'Altro',
}

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Tutte le disponibilità' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'out_of_stock', label: 'Esaurito (OOS)' },
]

const VISIBILITY_OPTIONS = [
  { value: '', label: 'Tutte le visibilità' },
  { value: 'visible', label: 'Visibili' },
  { value: 'hidden', label: 'Nascosti' },
]

const FEATURED_OPTIONS = [
  { value: '', label: 'Tutti' },
  { value: 'featured', label: 'In evidenza' },
]

const PAGE_SIZE = 25

function iconButtonClass() {
  return 'rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]'
}

function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === 'in_stock') return <Badge tone="success">In stock</Badge>
  if (availability === 'out_of_stock') return <Badge tone="danger">Esaurito (OOS)</Badge>
  return <Badge tone="warning">Preordine</Badge>
}

function SaleSummary({ variant }: { variant: ListingVariant }) {
  if (variant.soldQuantity === 0) {
    return <span className="text-[var(--ui-text-faint)]">—</span>
  }
  return (
    <div className="text-xs leading-5">
      <span className="font-medium text-[var(--ui-text)]">×{variant.soldQuantity}</span>
      {variant.saleSummaries.map((s) => (
        <span key={s.channel} className="text-[var(--ui-text-muted)]">
          {' · '}
          {SALES_CHANNEL_LABELS[s.channel] || s.channel} {euro.format(s.value)}
        </span>
      ))}
    </div>
  )
}

function variantAttrLabel(v: ListingVariant): string {
  const parts: string[] = []
  if (v.grade) parts.push(GRADE_LABELS[v.grade] || v.grade)
  if (v.condition) parts.push(v.condition)
  if (v.language) parts.push(LANGUAGE_LABELS[v.language] || v.language)
  return parts.join(' · ')
}

export function ListingsSection() {
  const [groups, setGroups] = useState<ListingGroup[]>([])
  const [channels, setChannels] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [availability, setAvailability] = useState('')
  const [channel, setChannel] = useState('')
  const [visibility, setVisibility] = useState('')
  const [featured, setFeatured] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    async (opts: { page?: number; search?: string } = {}) => {
      setLoading(true)
      try {
        const res = await searchListings({
          search: opts.search ?? query,
          availability: availability || undefined,
          channel: channel || undefined,
          visibility: visibility || undefined,
          featured: featured || undefined,
          limit: PAGE_SIZE,
          page: opts.page ?? page,
        })
        if (res.error) {
          setMessage({ text: res.error, type: 'error' })
        } else {
          setGroups(res.groups)
          setChannels(res.channels)
          setTotal(res.total)
          setTotalPages(Math.max(1, res.totalPages))
        }
      } catch {
        setMessage({ text: 'Errore nel caricamento del listino', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [query, availability, channel, visibility, featured, page],
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
        title="Listino"
        description={`${total} gruppi (per nome prodotto) · prezzo, costo medio, quantità, disponibilità e vendite`}
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
            placeholder="Cerca per nome prodotto..."
            className="pl-9"
          />
        </div>
        <Select
          value={availability}
          onChange={(e) => {
            setAvailability(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          {AVAILABILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          <option value="">Tutti i canali di vendita</option>
          {channels.map((c) => (
            <option key={c} value={c}>{SALES_CHANNEL_LABELS[c] || c}</option>
          ))}
        </Select>
        <Select
          value={visibility}
          onChange={(e) => {
            setVisibility(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Select
          value={featured}
          onChange={(e) => {
            setFeatured(e.target.value)
            setPage(1)
          }}
          className="w-auto"
        >
          {FEATURED_OPTIONS.map((o) => (
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
      ) : groups.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun gruppo in listino</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Prodotto</Th>
              <Th>Qty</Th>
              <Th>Venduti</Th>
              <Th>Disponibilità</Th>
              <Th>Prezzo</Th>
              <Th>Costo medio</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {groups.map((g) => {
              const expanded = expandedTitle === g.title
              return (
                <>
                  <Tr key={g.title} className={expanded ? 'bg-[var(--ui-surface-alt)]/60' : ''}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedTitle(expanded ? null : g.title)}
                          className={iconButtonClass()}
                          title={expanded ? 'Comprimi' : 'Mostra varianti'}
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words font-medium text-[var(--ui-text)]">{g.title}</span>
                            {g.featured ? (
                              <Star className="h-3.5 w-3.5 fill-[var(--ui-accent)] text-[var(--ui-accent)]" aria-label="In vetrina" />
                            ) : null}
                          </div>
                          {g.variantCount > 1 ? (
                            <span className="text-xs text-[var(--ui-text-faint)]">{g.variantCount} varianti</span>
                          ) : null}
                        </div>
                      </div>
                    </Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{g.totalQuantity}</Td>
                    <Td className="text-[var(--ui-text-muted)]">
                      {g.totalSold > 0 ? <span className="font-medium text-[var(--ui-text)]">×{g.totalSold}</span> : '—'}
                    </Td>
                    <Td><AvailabilityBadge availability={g.availability} /></Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{g.price != null ? euro.format(g.price) : '—'}</Td>
                    <Td className="text-[var(--ui-text-muted)]">{g.cost != null ? euro.format(g.cost) : '—'}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleFeatured(g)}
                          disabled={busy}
                          title={g.featured ? 'Togli dalla vetrina' : 'Metti in vetrina (bestseller)'}
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
                  {expanded ? (
                    <Tr key={`${g.title}-detail`}>
                      <Td colSpan={7} className="p-0">
                        <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 px-4 py-3">
                          <div className="overflow-x-auto rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)]">
                            <table className="w-full min-w-[720px] text-left text-sm text-[var(--ui-text)]">
                              <thead>
                                <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-alt)] text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                                  <th className="px-4 py-2 font-semibold">Variante</th>
                                  <th className="px-4 py-2 font-semibold">Stato</th>
                                  <th className="px-4 py-2 font-semibold">Qty</th>
                                  <th className="px-4 py-2 font-semibold">Disponibilità</th>
                                  <th className="px-4 py-2 font-semibold">Prezzo</th>
                                  <th className="px-4 py-2 font-semibold">Costo</th>
                                  <th className="px-4 py-2 font-semibold">Venduto</th>
                                  <th className="px-4 py-2 text-right font-semibold">Azioni</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--ui-border)]">
                                {g.variants.map((v) => (
                                  <tr key={v.id}>
                                    <td className="px-4 py-2 align-middle">
                                      <div className="min-w-0">
                                        <p className="break-words font-medium text-[var(--ui-text)]">{v.title}</p>
                                        {variantAttrLabel(v) ? (
                                          <p className="text-xs text-[var(--ui-text-faint)]">{variantAttrLabel(v)}</p>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 align-middle"><StatusBadge status={v.status || 'listed'} /></td>
                                    <td className="px-4 py-2 align-middle">{v.quantity}</td>
                                    <td className="px-4 py-2 align-middle"><AvailabilityBadge availability={v.availability} /></td>
                                    <td className="px-4 py-2 align-middle">{v.price != null ? euro.format(v.price) : '—'}</td>
                                    <td className="px-4 py-2 align-middle text-[var(--ui-text-muted)]">{v.cost != null ? euro.format(v.cost) : '—'}</td>
                                    <td className="px-4 py-2 align-middle"><SaleSummary variant={v} /></td>
                                    <td className="px-4 py-2 align-middle">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => openEdit(v.id)}
                                          disabled={busy}
                                          title="Modifica variante"
                                          className={iconButtonClass()}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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
          categories={categories}
          collections={collections}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onError={(msg) => notify(msg, 'error')}
        />
      ) : null}
    </div>
  )
}
