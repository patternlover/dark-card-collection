'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  deleteOrder,
  getOrders,
  recordDashboardSale,
  searchProducts,
  updateOrder,
  updateOrderStatus,
  type OrderDTO,
} from '@/app/dashboard/actions'
import { buildSaleOptions, type SaleProductOption } from '@/lib/sale-options'
import { SALES_CHANNEL_LABELS, STATUS_OPTIONS } from '@/lib/labels'
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  ModalSection,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  SortableTh,
  useSort,
  useSortedList,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const PLATFORM_OPTIONS = [
  { value: 'website', label: 'Sito' },
  { value: 'vinted', label: 'Vinted' },
  { value: 'ebay', label: 'eBay' },
  { value: 'cardmarket', label: 'Cardmarket' },
  { value: 'other', label: 'Altro' },
]

interface SaleLineForm {
  productId: string
  quantity: string
}

function emptySaleLine(): SaleLineForm {
  return { productId: '', quantity: '1' }
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
}

function OrderDetail({ order }: { order: OrderDTO }) {
  return (
    <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">Dettagli</p>
          <p className="text-[var(--ui-text-muted)]">
            Email: <span className="font-semibold text-[var(--ui-text)]">{order.email || '—'}</span>
          </p>
          {order.customerUsername ? (
            <p className="text-[var(--ui-text-muted)]">
              Username: <span className="font-semibold text-[var(--ui-text)]">{order.customerUsername}</span>
            </p>
          ) : null}
          <p className="text-[var(--ui-text-muted)]">
            Totale: <span className="font-semibold text-[var(--ui-text)]">{euro.format(order.value || 0)}</span>
          </p>
          <p className="text-[var(--ui-text-muted)]">
            Stato: <span className="font-semibold text-[var(--ui-text)]">{STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}</span>
          </p>
          <p className="text-[var(--ui-text-muted)]">
            Margine: <span className="font-semibold text-[var(--ui-text)]">{order.margin != null ? euro.format(order.margin) : 'N/D'}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">Pagamento</p>
          <p className="text-[var(--ui-text-muted)]">
            Canale: <span className="font-semibold text-[var(--ui-text)]">{SALES_CHANNEL_LABELS[order.salesChannel || ''] || order.salesChannel || '—'}</span>
          </p>
          <p className="break-all text-[var(--ui-text-muted)]">
            Session: <span className="font-mono text-xs text-[var(--ui-text-faint)]">{order.stripeSessionId || '—'}</span>
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">Articoli ordinati</p>
          {order.items.length === 0 ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Nessun dettaglio articolo</p>
          ) : (
            <ul className="space-y-1.5">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-[var(--ui-text-muted)]">
                    <span className="font-semibold text-[var(--ui-text)]">{item.title}</span>
                    <span className="text-[var(--ui-text-faint)]"> × {item.quantity}</span>
                    {item.unitCostSnapshot != null ? (
                      <span className="text-[var(--ui-text-faint)]"> · costo {euro.format(item.unitCostSnapshot)}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold text-[var(--ui-text)]">
                    {euro.format((item.price || 0) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function OrdersSection() {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const { sortBy, sortDir, handleSort } = useSort('createdAt')
  const sorted = useSortedList(orders, sortBy, sortDir)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showExternal, setShowExternal] = useState(false)
  const [productOptions, setProductOptions] = useState<SaleProductOption[]>([])
  const [saleLines, setSaleLines] = useState<SaleLineForm[]>([emptySaleLine()])
  const [extChannel, setExtChannel] = useState('website')
  const [extEmail, setExtEmail] = useState('')
  const [extUsername, setExtUsername] = useState('')
  const [extSalePrice, setExtSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState('')
  const [busy, setBusy] = useState(false)

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
    setSaleDate(new Date().toLocaleDateString('it-IT'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await updateOrderStatus(id, status)
      if (!res.ok) {
        setError(res.message || 'Errore durante l\'aggiornamento')
        return
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? res.data : o)))
    } catch {
      setError('Errore durante l\'aggiornamento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo ordine? Lo stock verrà ripristinato (FIFO).')) return
    setBusy(true)
    setError(null)
    try {
      const res = await deleteOrder(id)
      if (!res.ok) {
        setError(res.message || 'Errore durante l\'eliminazione')
        return
      }
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante l\'eliminazione')
    } finally {
      setBusy(false)
    }
  }

  const openExternal = async () => {
    setShowExternal(true)
    setSaleLines([emptySaleLine()])
    setExtChannel('website')
    setExtEmail('')
    setExtUsername('')
    setSaleDate(new Date().toLocaleDateString('it-IT'))
    try {
      const res = await searchProducts({ limit: 200 })
      setProductOptions(
        res.docs
          .filter((p) => (p.quantity ?? 0) > 0)
          .map((p) => ({
            id: p.id,
            title: p.title,
            quantity: p.quantity ?? 0,
            price: p.price ?? null,
            costOfGoodsSold: p.costOfGoodsSold ?? null,
            grade: p.grade ?? null,
            condition: p.condition ?? null,
            language: p.language ?? null,
          })),
      )
    } catch {
      setProductOptions([])
    }
  }

  const updateSaleLine = (index: number, patch: Partial<SaleLineForm>) => {
    setSaleLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const saleEntries = buildSaleOptions(productOptions)

  const handleExternal = async () => {
    const validLines = saleLines.filter((l) => l.productId && (Number(l.quantity) || 0) > 0)
    if (validLines.length === 0) {
      setError('Aggiungi almeno un prodotto con quantità maggiore di 0')
      return
    }
    const totalSalePrice = Number(extSalePrice)
    if (!totalSalePrice || totalSalePrice <= 0) {
      setError('Inserisci un prezzo di vendita totale valido')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await recordDashboardSale({
        items: validLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity) || 1,
          price: 0,
        })),
        totalSalePrice,
        channel: extChannel as 'website' | 'vinted' | 'ebay' | 'cardmarket' | 'other',
        email: extEmail.trim() || undefined,
        username: extUsername.trim() || undefined,
        saleDate: saleDate.trim() || undefined,
      })
      if (!res.ok) {
        setError(res.message ?? 'Errore durante la registrazione della vendita')
        return
      }
      setShowExternal(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Ordini" description="Vendite sito web ed esterne, stati e margine.">
        <Button onClick={openExternal}>
          <Plus className="h-4 w-4" /> Registra Vendita
        </Button>
      </PageHeader>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Table>
        <THead>
          <tr>
            <SortableTh label="Ordine" field="transactionId" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Data" field="createdAt" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Canale" field="salesChannel" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Articoli" field="itemCount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Totale" field="value" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortableTh label="Margine" field="margin" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <Th className="text-right">Azioni</Th>
          </tr>
        </THead>
        <TBody>
          {loading ? (
            <Tr>
              <Td colSpan={7} className="py-10 text-center text-[var(--ui-text-muted)]">
                Caricamento...
              </Td>
            </Tr>
          ) : orders.length === 0 ? (
            <Tr>
              <Td colSpan={7} className="py-10 text-center text-[var(--ui-text-muted)]">
                Nessun ordine
              </Td>
            </Tr>
          ) : (
            sorted.map((o) => {
              const expanded = expandedId === o.id
              return (
                <OrderRow
                  key={o.id}
                  order={o}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : o.id)}
                  onStatusChange={(status) => handleStatus(o.id, status)}
                  onDelete={() => handleDelete(o.id)}
                  busy={busy}
                />
              )
            })
          )}
        </TBody>
      </Table>

      {showExternal ? (
        <Modal
          title="Registra Vendita"
          onClose={() => setShowExternal(false)}
          maxWidth="max-w-3xl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowExternal(false)}>
                Annulla
              </Button>
              <Button onClick={handleExternal} disabled={busy}>
                {busy ? 'Registrazione...' : 'Registra Vendita'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data vendita" htmlFor="ext-date">
                <Input
                  id="ext-date"
                  type="text"
                  inputMode="numeric"
                  value={saleDate}
                  onChange={(e) => setSaleDate(formatDateInput(e.target.value))}
                  placeholder="GG/MM/AAAA"
                />
              </Field>
              <Field label="Canale *" htmlFor="ext-platform">
                <Select
                  id="ext-platform"
                  value={extChannel}
                  onChange={(e) => setExtChannel(e.target.value)}
                >
                  {PLATFORM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email cliente" htmlFor="ext-email">
                <Input
                  id="ext-email"
                  type="email"
                  value={extEmail}
                  onChange={(e) => setExtEmail(e.target.value)}
                  placeholder="nome@esempio.com (opzionale)"
                />
              </Field>
              <Field label="Username cliente" htmlFor="ext-username">
                <Input
                  id="ext-username"
                  type="text"
                  value={extUsername}
                  onChange={(e) => setExtUsername(e.target.value)}
                  placeholder="es. @utente (opzionale)"
                />
              </Field>
            </div>

            <ModalSection
              title="Articoli"
              action={
                <Button variant="ghost" size="sm" onClick={() => setSaleLines((prev) => [...prev, emptySaleLine()])}>
                  <Plus className="h-3.5 w-3.5" /> Aggiungi
                </Button>
              }
            >
              <div className="space-y-3">
                {saleLines.map((line, index) => {
                  const product = productOptions.find((p) => p.id === line.productId)
                  const cost = product?.costOfGoodsSold ?? 0

                  return (
                    <div key={index} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
                          Articolo {index + 1}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSaleLines((prev) => prev.filter((_, i) => i !== index))}
                          disabled={saleLines.length === 1}
                          title="Rimuovi articolo"
                          className="p-1 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Field label="Prodotto *">
                            <Select
                              value={line.productId}
                              onChange={(e) => updateSaleLine(index, { productId: e.target.value })}
                            >
                              <option value="">— Seleziona prodotto —</option>
                              {saleEntries.map((entry) =>
                                entry.kind === 'option' ? (
                                  <option key={entry.value} value={entry.value}>
                                    {entry.label}
                                  </option>
                                ) : (
                                  <optgroup key={entry.label} label={entry.label}>
                                    {entry.options.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                ),
                              )}
                            </Select>
                          </Field>
                        </div>
                        <Field label="Quantità *">
                          <Input
                            type="number"
                            min="1"
                            max={product?.quantity ?? undefined}
                            value={line.quantity}
                            onChange={(e) => updateSaleLine(index, { quantity: e.target.value })}
                          />
                        </Field>
                      </div>
                      {cost > 0 ? (
                        <div className="mt-1 text-xs text-[var(--ui-text-muted)]">
                          Costo unitario: {euro.format(cost)}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </ModalSection>

            {(() => {
              const totalCost = saleLines.reduce((sum, l) => {
                const qty = Number(l.quantity) || 0
                const product = productOptions.find((p) => p.id === l.productId)
                return sum + (product?.costOfGoodsSold ?? 0) * qty
              }, 0)
              const inputPrice = Number(extSalePrice) || 0
              const markupPercent = totalCost > 0 ? ((inputPrice - totalCost) / totalCost) * 100 : 0
              const computedItems = saleLines
                .filter((l) => l.productId && (Number(l.quantity) || 0) > 0)
                .map((l) => {
                  const product = productOptions.find((p) => p.id === l.productId)
                  const cost = product?.costOfGoodsSold ?? 0
                  const qty = Number(l.quantity) || 0
                  const unitPrice = Math.round(cost * (1 + markupPercent / 100) * 100) / 100
                  const profit = (unitPrice - cost) * qty
                  return { title: product?.title || 'Prodotto', qty, cost, unitPrice, profit }
                })
              const computedTotal = computedItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
              const computedMargin = computedTotal - totalCost

              return (
                <>
                  <Field label="Prezzo di vendita totale (€) *" htmlFor="ext-total-price">
                    <Input
                      id="ext-total-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={extSalePrice}
                      onChange={(e) => setExtSalePrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </Field>

                  {totalCost > 0 && inputPrice > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-3 text-sm">
                        <div>
                          <p className="text-xs text-[var(--ui-text-muted)]">Costo investito</p>
                          <p className="font-semibold text-[var(--ui-text)]">{euro.format(totalCost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--ui-text-muted)]">Margine</p>
                          <p className={`font-semibold ${computedMargin >= 0 ? 'text-[var(--ui-text)]' : 'text-[var(--ui-danger)]'}`}>{euro.format(computedMargin)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--ui-text-muted)]">Markup</p>
                          <p className={`font-semibold ${markupPercent >= 0 ? 'text-[var(--ui-text)]' : 'text-[var(--ui-danger)]'}`}>{markupPercent.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">Dettaglio per prodotto</p>
                        <div className="divide-y divide-[var(--ui-border)]/80">
                          {computedItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <span className="min-w-0 truncate text-[var(--ui-text-muted)]">
                                <span className="font-semibold text-[var(--ui-text)]">{item.title}</span>
                                <span className="text-[var(--ui-text-faint)]"> × {item.qty}</span>
                              </span>
                              <span className="shrink-0 text-[var(--ui-text-muted)]">
                                {euro.format(item.unitPrice)}/uno
                                <span className={`ml-2 ${item.profit >= 0 ? 'text-[var(--ui-text)]' : 'text-[var(--ui-danger)]'}`}>
                                  ({item.profit >= 0 ? '+' : ''}{euro.format(item.profit)})
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-[var(--ui-border)] pt-2 text-sm font-semibold">
                          <span className="text-[var(--ui-text-muted)]">Totale calcolato</span>
                          <span className="text-[var(--ui-text)]">{euro.format(computedTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )
            })()}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onStatusChange,
  onDelete,
  busy,
}: {
  order: OrderDTO
  expanded: boolean
  onToggle: () => void
  onStatusChange: (status: string) => void
  onDelete: () => void
  busy: boolean
}) {
  return (
    <>
      <Tr>
        <Td>
          <button
            onClick={onToggle}
            className="flex items-center gap-2 font-medium text-[var(--ui-text)] transition-colors hover:text-[var(--ui-accent-hover)]"
          >
            <ChevronDown
              className={`h-4 w-4 text-[var(--ui-text-faint)] transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            {order.transactionId || order.id}
          </button>
        </Td>
        <Td className="text-[var(--ui-text-muted)]">
          {(order.saleDate || new Date(order.createdAt).toLocaleDateString('it-IT'))}
        </Td>
        <Td className="text-[var(--ui-text-muted)]">{SALES_CHANNEL_LABELS[order.salesChannel || ''] || order.salesChannel || '—'}</Td>
        <Td className="text-[var(--ui-text-muted)]">{order.itemCount}</Td>
        <Td className="font-medium text-[var(--ui-text)]">{euro.format(order.value || 0)}</Td>
        <Td className={order.margin != null && order.margin < 0 ? 'font-medium text-[var(--ui-danger)]' : 'font-medium text-[var(--ui-text)]'}>
          {order.margin != null ? euro.format(order.margin) : '—'}
        </Td>
        <Td>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle()}
              disabled={busy}
              title="Modifica ordine"
              className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={busy}
              title="Elimina ordine"
              className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Td>
      </Tr>
      {expanded ? (
        <Tr>
          <Td colSpan={7} className="p-0">
            <OrderDetail order={order} />
          </Td>
        </Tr>
      ) : null}
    </>
  )
}
