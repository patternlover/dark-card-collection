'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import {
  getOrders,
  recordExternalSale,
  searchProducts,
  updateOrderStatus,
  type OrderDTO,
} from '@/app/dashboard/actions'
import { buildSaleOptions, type SaleProductOption } from '@/lib/sale-options'
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
  Tr,
  SortableTh,
  useSort,
  useSortedList,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In Attesa pagamento' },
  { value: 'paid', label: 'Pagato' },
  { value: 'shipped', label: 'Spedito' },
  { value: 'delivered', label: 'Consegnato' },
  { value: 'cancelled', label: 'Annullato' },
]

const SALES_CHANNEL_LABELS: Record<string, string> = {
  website: 'Sito web',
  vinted: 'Vinted',
  ebay: 'eBay',
  cardmarket: 'Cardmarket',
  other: 'Altro',
}

const PLATFORM_OPTIONS = [
  { value: 'vinted', label: 'Vinted' },
  { value: 'ebay', label: 'eBay' },
  { value: 'cardmarket', label: 'Cardmarket' },
  { value: 'other', label: 'Altro' },
]

function OrderDetail({ order }: { order: OrderDTO }) {
  return (
    <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">Dettagli</p>
          <p className="text-[var(--ui-text-muted)]">
            Email: <span className="font-semibold text-[var(--ui-text)]">{order.email || '—'}</span>
          </p>
          <p className="text-[var(--ui-text-muted)]">
            Totale: <span className="font-semibold text-[var(--ui-text)]">{euro.format(order.value || 0)}</span>
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
  const [ext, setExt] = useState({ productId: '', platform: 'vinted', quantity: '1', salePrice: '' })
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
    load()
  }, [load])

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await updateOrderStatus(id, status)
      if (!res.ok) {
        setError(res.message)
        return
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? res.data : o)))
    } catch {
      setError('Errore durante l\'aggiornamento')
    }
  }

  const openExternal = async () => {
    setShowExternal(true)
    try {
      const res = await searchProducts({ limit: 200 })
      setProductOptions(
        res.docs.map((p) => ({
          id: p.id,
          title: p.title,
          quantity: p.quantity ?? 0,
          price: p.price ?? null,
          grade: p.grade ?? null,
          condition: p.condition ?? null,
          language: p.language ?? null,
        })),
      )
    } catch {
      setProductOptions([])
    }
  }

  const selectedProduct = productOptions.find((p) => p.id === ext.productId) || null
  const saleEntries = buildSaleOptions(productOptions)

  const handleExternal = async () => {
    const qty = Number(ext.quantity) || 0
    const price = Number(ext.salePrice)
    if (!ext.productId) {
      setError('Seleziona un prodotto')
      return
    }
    if (qty <= 0) {
      setError('La quantità deve essere maggiore di 0')
      return
    }
    if (isNaN(price) || price < 0) {
      setError('Inserisci un prezzo di vendita valido')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await recordExternalSale({ productId: ext.productId, quantity: qty, platform: ext.platform, salePrice: price })
      if (!res.ok) {
        setError(res.message ?? 'Errore durante la registrazione della vendita')
        return
      }
      setShowExternal(false)
      setExt({ productId: '', platform: 'vinted', quantity: '1', salePrice: '' })
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
          <Plus className="h-4 w-4" /> Registra Vendita Esterna
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
            <SortableTh label="Stato" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
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
                />
              )
            })
          )}
        </TBody>
      </Table>

      {showExternal ? (
        <Modal
          title="Registra Vendita Esterna"
          onClose={() => setShowExternal(false)}
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
            <Field label="Prodotto *" htmlFor="ext-product">
              <Select
                id="ext-product"
                value={ext.productId}
                onChange={(e) => {
                  const p = productOptions.find((x) => x.id === e.target.value)
                  setExt({
                    productId: e.target.value,
                    platform: ext.platform,
                    quantity: '1',
                    salePrice: p?.price != null ? String(p.price) : '',
                  })
                }}
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Piattaforma *" htmlFor="ext-platform">
                <Select
                  id="ext-platform"
                  value={ext.platform}
                  onChange={(e) => setExt({ ...ext, platform: e.target.value })}
                >
                  {PLATFORM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantità venduta *" htmlFor="ext-qty">
                <Input
                  id="ext-qty"
                  type="number"
                  min="1"
                  max={selectedProduct?.quantity ?? undefined}
                  value={ext.quantity}
                  onChange={(e) => setExt({ ...ext, quantity: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Prezzo effettivo incassato (€) *" htmlFor="ext-price">
              <Input
                id="ext-price"
                type="number"
                step="0.01"
                min="0"
                value={ext.salePrice}
                onChange={(e) => setExt({ ...ext, salePrice: e.target.value })}
              />
            </Field>
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
}: {
  order: OrderDTO
  expanded: boolean
  onToggle: () => void
  onStatusChange: (status: string) => void
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
          {new Date(order.createdAt).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Td>
        <Td className="text-[var(--ui-text-muted)]">{SALES_CHANNEL_LABELS[order.salesChannel || ''] || order.salesChannel || '—'}</Td>
        <Td className="text-[var(--ui-text-muted)]">{order.itemCount}</Td>
        <Td className="font-medium text-[var(--ui-text)]">{euro.format(order.value || 0)}</Td>
        <Td className={order.margin != null && order.margin < 0 ? 'font-medium text-[var(--ui-danger)]' : 'font-medium text-[var(--ui-text)]'}>
          {order.margin != null ? euro.format(order.margin) : '—'}
        </Td>
        <Td>
          <Select
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-auto py-1.5 text-xs font-medium"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
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
