'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getOrders, updateOrderStatus, type OrderDTO } from '@/app/dashboard/actions'
import {
  Alert,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In Attesa pagamento' },
  { value: 'paid', label: 'Pagato' },
  { value: 'shipped', label: 'Spedito' },
  { value: 'delivered', label: 'Consegnato' },
  { value: 'cancelled', label: 'Annullato' },
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
            Articoli: <span className="font-semibold text-[var(--ui-text)]">{order.itemCount}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">Pagamento</p>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      const updated = await updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
    } catch {
      setError('Errore durante l\'aggiornamento')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Ordini" description="Gestione stati ordini e dettagli di vendita." />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Table>
        <THead>
          <tr>
            <Th>Ordine</Th>
            <Th>Data</Th>
            <Th>Email</Th>
            <Th>Articoli</Th>
            <Th>Totale</Th>
            <Th>Stato</Th>
          </tr>
        </THead>
        <TBody>
          {loading ? (
            <Tr>
              <Td colSpan={6} className="py-10 text-center text-[var(--ui-text-muted)]">
                Caricamento...
              </Td>
            </Tr>
          ) : orders.length === 0 ? (
            <Tr>
              <Td colSpan={6} className="py-10 text-center text-[var(--ui-text-muted)]">
                Nessun ordine
              </Td>
            </Tr>
          ) : (
            orders.map((o) => {
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
        <Td className="text-[var(--ui-text-muted)]">{order.email || '—'}</Td>
        <Td className="text-[var(--ui-text-muted)]">{order.itemCount}</Td>
        <Td className="font-medium text-[var(--ui-text)]">{euro.format(order.value || 0)}</Td>
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
          <Td colSpan={6} className="p-0">
            <OrderDetail order={order} />
          </Td>
        </Tr>
      ) : null}
    </>
  )
}
