'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Search, ShoppingCart, Star } from 'lucide-react'
import {
  getCategories,
  getCollections,
  getProductById,
  recordManualWebsiteSale,
  searchListingProducts,
  searchListings,
  toggleVariantVisibility as toggleVariantVisibilityAction,
  updateGroup,
  type CategoryOption,
  type CollectionOption,
  type ProductDTO,
} from '@/app/dashboard/actions'
import type { ListingGroup, ListingVariant } from '@/lib/listings'
import { EditProductModal } from '@/components/dashboard/EditProductModal'
import { StatusBadge } from './productShared'
import { GRADE_LABELS, LANGUAGE_LABELS } from './productShared'
import { Badge } from './ui'
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  TogglePills,
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

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'listed', label: 'Disponibile' },
  { value: 'hold', label: 'In Attesa' },
  { value: 'sold', label: 'Venduto' },
]

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

const PAGE_SIZE = 25

type View = 'groups' | 'products'

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
  const [view, setView] = useState<View>('groups')
  const [groups, setGroups] = useState<ListingGroup[]>([])
  const [featuredCount, setFeaturedCount] = useState(0)
  const [items, setItems] = useState<ListingVariant[]>([])
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [status, setStatus] = useState('')
  const [availability, setAvailability] = useState('')
  const [visibility, setVisibility] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [selling, setSelling] = useState<ListingVariant | null>(null)
  const [saleQty, setSaleQty] = useState('1')
  const [salePrice, setSalePrice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getCollections().then(setCollections).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedQuery(query)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(
    async (opts: { page?: number } = {}) => {
      setLoading(true)
      const pageNum = opts.page ?? page
      try {
        if (view === 'groups') {
          const res = await searchListings({
            search: appliedQuery || undefined,
            availability: availability || undefined,
            visibility: visibility || undefined,
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
        } else {
          const res = await searchListingProducts({
            search: appliedQuery || undefined,
            status: status || undefined,
            availability: availability || undefined,
            visibility: visibility || undefined,
            limit: PAGE_SIZE,
            page: pageNum,
          })
          if (res.error) {
            setMessage({ text: res.error, type: 'error' })
            return
          }
          setItems(res.items)
          setTotal(res.total)
          setTotalPages(Math.max(1, res.totalPages))
        }
      } catch {
        setMessage({ text: 'Errore nel caricamento del listino', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [view, appliedQuery, status, availability, visibility, page],
  )

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const switchView = (v: View) => {
    setView(v)
    setPage(1)
    setEditing(null)
    setSelling(null)
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

  const handleVariantVisibility = async (v: ListingVariant) => {
    const target = !v.isVisible
    setItems((prev) => prev.map((x) => (x.id === v.id ? { ...x, isVisible: target } : x)))
    setBusy(true)
    try {
      const res = await toggleVariantVisibilityAction(v.id, target)
      if (!res.ok) {
        notify(res.message || 'Errore durante l\'aggiornamento', 'error')
        load()
        return
      }
      notify(target ? 'Prodotto visibile nello shop' : 'Prodotto nascosto dallo shop')
      load()
    } catch {
      notify('Errore durante l\'aggiornamento del prodotto', 'error')
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

  const openSale = (v: ListingVariant) => {
    setSelling(v)
    setSaleQty('1')
    setSalePrice(v.price != null ? String(v.price) : '')
  }

  const handleSale = async () => {
    if (!selling) return
    const qty = Number(saleQty) || 0
    const price = Number(salePrice)
    if (qty <= 0) {
      notify('La quantità deve essere maggiore di 0', 'error')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      notify('Inserisci un prezzo di vendita valido', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await recordManualWebsiteSale({ productId: selling.id, quantity: qty, price })
      if (!res.ok) {
        notify(res.message || 'Errore durante la vendita', 'error')
        return
      }
      setSelling(null)
      notify('Vendita registrata (canale: Sito web)')
      load()
    } catch {
      notify('Errore durante la vendita', 'error')
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Listino"
        description={
          view === 'groups'
            ? `${total} gruppi (per nome prodotto) · In evidenza ${featuredCount}/4 · prezzo, costo medio, quantità e disponibilità`
            : `${total} prodotti singoli · dettaglio per item, stato e vendite`
        }
      >
        <TogglePills<View>
          value={view}
          onChange={switchView}
          options={[
            { value: 'groups', label: 'Gruppi prodotto' },
            { value: 'products', label: 'Prodotti' },
          ]}
        />
      </PageHeader>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {view === 'products' ? (
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
          ) : null}
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
        </div>
        <div className="relative w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per nome prodotto..."
            className="pl-9"
          />
        </div>
      </div>

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : view === 'groups' ? (
        groups.length === 0 ? (
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
              {groups.map((g) => (
                <Tr key={g.title} className="bg-[var(--ui-surface-alt)]">
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-semibold text-[var(--ui-text)]">{g.title}</span>
                      {g.featured ? (
                        <Star className="h-3.5 w-3.5 fill-[var(--ui-accent)] text-[var(--ui-accent)]" aria-label="In vetrina" />
                      ) : null}
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
        )
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun prodotto in listino</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Prodotto</Th>
              <Th>Stock</Th>
              <Th>Venduti</Th>
              <Th>Disponibilità</Th>
              <Th>Prezzo</Th>
              <Th>Costo medio</Th>
              <Th>Stato</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {items.map((v) => (
              <Tr key={v.id}>
                <Td>
                  <div className="min-w-0">
                    <p className="break-words font-medium text-[var(--ui-text)]">{v.title}</p>
                    {variantAttrLabel(v) ? (
                      <p className="text-xs text-[var(--ui-text-faint)]">{variantAttrLabel(v)}</p>
                    ) : null}
                  </div>
                </Td>
                <Td className="font-semibold text-[var(--ui-text)]">{v.quantity}</Td>
                <Td><SaleSummary variant={v} /></Td>
                <Td><AvailabilityBadge availability={v.availability} /></Td>
                <Td className="font-semibold text-[var(--ui-text)]">{v.price != null ? euro.format(v.price) : '—'}</Td>
                <Td className="text-[var(--ui-text-muted)]">{v.cost != null ? euro.format(v.cost) : '—'}</Td>
                <Td><StatusBadge status={v.status || 'listed'} /></Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleVariantVisibility(v)}
                      disabled={busy}
                      title={v.isVisible ? 'Nascondi singolo prodotto' : 'Mostra singolo prodotto'}
                      className={iconButtonClass()}
                    >
                      {v.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openSale(v)}
                      disabled={busy}
                      title="Vendi"
                      className={iconButtonClass()}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(v.id)}
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
            Pagina {page} di {totalPages} · {total} {view === 'groups' ? 'gruppi' : 'prodotti'}
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

      {selling ? (
        <Modal
          title="Vendi prodotto"
          onClose={() => setSelling(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelling(null)}>
                Annulla
              </Button>
              <Button onClick={handleSale} disabled={busy}>
                {busy ? 'Registrazione...' : 'Registra Vendita'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="break-words font-medium text-[var(--ui-text)]">{selling.title}</p>
              {variantAttrLabel(selling) ? (
                <p className="text-xs text-[var(--ui-text-faint)]">{variantAttrLabel(selling)}</p>
              ) : null}
            </div>
            <Field label="Quantità *" htmlFor="sale-qty">
              <Input
                id="sale-qty"
                type="number"
                min="1"
                max={selling.quantity}
                value={saleQty}
                onChange={(e) => setSaleQty(e.target.value)}
              />
            </Field>
            <Field label="Prezzo effettivo incassato (€) *" htmlFor="sale-price">
              <Input
                id="sale-price"
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </Field>
            <p className="text-xs text-[var(--ui-text-faint)]">
              Vendita manuale registrata sul sito (canale: Sito web). Stock, FIFO e costo medio aggiornati automaticamente.
            </p>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
