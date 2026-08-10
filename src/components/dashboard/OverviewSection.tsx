'use client'

import { useCallback, useEffect, useState } from 'react'
import { getOverview, type OverviewData } from '@/app/dashboard/actions'

const STATUS_LABELS: Record<string, string> = {
  listed: 'Disponibile',
  hold: 'In Attesa',
  sold: 'Venduto',
  pending: 'In Attesa pagamento',
  paid: 'Pagato',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const STATUS_COLORS: Record<string, string> = {
  listed: 'text-green-400',
  hold: 'text-amber-400',
  sold: 'text-zinc-400',
  pending: 'text-amber-400',
  paid: 'text-sky-400',
  shipped: 'text-violet-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/70 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-zinc-50">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  )
}

export function OverviewSection() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setOverview(await getOverview())
    } catch {
      setError('Errore nel caricamento dei dati')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
        {error}
      </p>
    )
  }

  if (!overview) {
    return <p className="text-sm text-zinc-500">Caricamento...</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-50">Panoramica</h1>
        <p className="mt-1 text-sm text-zinc-400">Andamento di inventario e vendite.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">Inventario</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Totale" value={overview.products.total} />
          <StatCard label="Disponibili" value={overview.products.listed} />
          <StatCard label="In Attesa" value={overview.products.hold} />
          <StatCard label="Venduti" value={overview.products.sold} />
          <StatCard label="Visibili" value={overview.products.visible} />
          <StatCard label="Stock basso" value={overview.products.lowStock} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard label="Valore inventario" value={euro.format(overview.inventoryValue)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">Ordini</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Totale" value={overview.orders.total} />
          <StatCard label="Da pagare" value={overview.orders.pending} />
          <StatCard label="Pagati" value={overview.orders.paid} />
          <StatCard label="Spediti" value={overview.orders.shipped} />
          <StatCard label="Consegnati" value={overview.orders.delivered} />
          <StatCard label="Annullati" value={overview.orders.cancelled} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="Fatturato (pagato/spedito/consegnato)"
            value={euro.format(overview.revenue)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-500">Ultimi ordini</h2>
        <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3">Ordine</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Articoli</th>
                <th className="px-4 py-3">Totale</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
              {overview.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-semibold text-zinc-100">{o.transactionId || o.id}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(o.createdAt).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{o.itemCount}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-100">{euro.format(o.value || 0)}</td>
                  <td className={`px-4 py-3 font-semibold ${STATUS_COLORS[o.status] ?? 'text-zinc-100'}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </td>
                </tr>
              ))}
              {overview.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Nessun ordine
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
