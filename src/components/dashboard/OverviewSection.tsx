'use client'

import { useCallback, useEffect, useState } from 'react'
import { getOverview, type OverviewData } from '@/app/dashboard/actions'
import { STATUS_LABELS } from '@/lib/labels'
import {
  Alert,
  Badge,
  Card,
  CardContent,
  PageHeader,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from './ui'
import type { BadgeTone } from './ui'

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: 'warning',
  paid: 'info',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'danger',
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--ui-text-faint)]">{label}</p>
        <p className="mt-1 text-xl font-bold text-[var(--ui-text)]">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-[var(--ui-text-faint)]">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
      {children}
    </h2>
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
    return <Alert tone="danger">{error}</Alert>
  }

  if (!overview) {
    return <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Panoramica" description="Andamento di inventario e vendite." />

      <section>
        <SectionTitle>Inventario</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Totale" value={overview.products.total} />
          <StatCard label="In stock" value={overview.products.inStock} />
          <StatCard label="Esauriti" value={overview.products.outOfStock} />
          
          <StatCard label="Visibili" value={overview.products.visible} />
          <StatCard label="Stock basso" value={overview.products.lowStock} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard label="Valore inventario" value={euro.format(overview.inventoryValue)} />
        </div>
      </section>

      <section>
        <SectionTitle>Ordini</SectionTitle>
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
        <SectionTitle>Ultimi ordini</SectionTitle>
        <Table>
          <THead>
            <tr>
              <Th>Ordine</Th>
              <Th>Data</Th>
              <Th>Articoli</Th>
              <Th>Totale</Th>
              <Th>Stato</Th>
            </tr>
          </THead>
          <TBody>
            {overview.recentOrders.map((o) => (
              <Tr key={o.id}>
                <Td className="font-medium text-[var(--ui-text)]">{o.transactionId || o.id}</Td>
                <Td className="text-[var(--ui-text-muted)]">
                  {new Date(o.createdAt).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Td>
                <Td className="text-[var(--ui-text-muted)]">{o.itemCount}</Td>
                <Td className="font-medium text-[var(--ui-text)]">{euro.format(o.value || 0)}</Td>
                <Td>
                  <Badge tone={STATUS_TONES[o.status] ?? 'neutral'}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
            {overview.recentOrders.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="py-8 text-center text-[var(--ui-text-muted)]">
                  Nessun ordine
                </Td>
              </Tr>
            ) : null}
          </TBody>
        </Table>
      </section>
    </div>
  )
}
