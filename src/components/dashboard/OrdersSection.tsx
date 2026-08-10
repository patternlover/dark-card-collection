'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getOrders, updateOrderStatus, type OrderDTO } from '@/app/dashboard/actions'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400',
  paid: 'text-sky-400',
  shipped: 'text-violet-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In Attesa pagamento' },
  { value: 'paid', label: 'Pagato' },
  { value: 'shipped', label: 'Spedito' },
  { value: 'delivered', label: 'Consegnato' },
  { value: 'cancelled', label: 'Annullato' },
]

function OrderDetail({ order }: { order: OrderDTO }) {
  return (
    <div className="border-t-2 border-zinc-800 bg-zinc-950/40 px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dettagli</p>
          <p className="text-zinc-300">
            Email: <span className="font-semibold text-zinc-100">{order.email || '—'}</span>
          </p>
          <p className="text-zinc-300">
            Totale: <span className="font-semibold text-zinc-100">{euro.format(order.value || 0)}</span>
          </p>
          <p className="text-zinc-300">
            Articoli: <span className="font-semibold text-zinc-100">{order.itemCount}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pagamento</p>
          <p className="break-all text-zinc-300">
            Session: <span className="font-mono text-xs text-zinc-500">{order.stripeSessionId || '—'}</span>
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Articoli ordinati</p>
          {order.items.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessun dettaglio articolo</p>
          ) : (
            <ul className="space-y-1.5">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-zinc-300">
                    <span className="font-semibold text-zinc-100">{item.title}</span>
                    <span className="text-zinc-500"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-zinc-100">
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
      <div>
        <h1 className="text-3xl font-black text-zinc-50">Ordini</h1>
        <p className="mt-1 text-sm text-zinc-400">Gestione stati ordini e dettagli di vendita.</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Ordine</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Articoli</th>
              <th className="px-4 py-3">Totale</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Caricamento...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Nessun ordine
                </td>
              </tr>
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
          </tbody>
        </table>
      </div>
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
      <tr className="hover:bg-zinc-900/50">
        <td className="px-4 py-3">
          <button onClick={onToggle} className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-[var(--accent)]">
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {order.transactionId || order.id}
          </button>
        </td>
        <td className="px-4 py-3 text-zinc-400">
          {new Date(order.createdAt).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </td>
        <td className="px-4 py-3 text-zinc-400">{order.email || '—'}</td>
        <td className="px-4 py-3 text-zinc-400">{order.itemCount}</td>
        <td className="px-4 py-3 font-semibold text-zinc-100">{euro.format(order.value || 0)}</td>
        <td className="px-4 py-3">
          <select
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-semibold outline-none ${STATUS_COLORS[order.status] ?? 'text-zinc-100'}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={6} className="p-0">
            <OrderDetail order={order} />
          </td>
        </tr>
      ) : null}
    </>
  )
}
