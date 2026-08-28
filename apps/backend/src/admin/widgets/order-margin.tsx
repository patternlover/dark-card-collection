"use client"

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

interface CostSnapshot {
  quantity?: number
  unit_cost_snapshot?: number
}

interface OrderData {
  total?: number | string
  metadata?: Record<string, unknown> | null
}

/**
 * Margine per vendita: ricavo − Σ(qty × costo FIFO snapshot).
 * Lo snapshot vive in `order.metadata.dcc_cost_snapshots`, scritto dal workflow
 * `recordExternalSale` (per gli ordini website arriva da F2 via subscriber).
 */
function OrderMarginWidget({ data }: { data?: OrderData }) {
  const snapshots = (data?.metadata?.dcc_cost_snapshots ?? []) as CostSnapshot[]
  const totalCost = snapshots.reduce(
    (sum, s) => sum + (Number(s.quantity) || 0) * (Number(s.unit_cost_snapshot) || 0),
    0,
  )
  const revenue = Number(data?.total ?? 0)
  const margin = revenue - totalCost
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Margine (procurement)</Heading>
      </div>
      <div className="flex flex-col gap-1 px-6 py-4">
        <Text>Ricavo: €{revenue.toFixed(2)}</Text>
        <Text>Costo FIFO: €{totalCost.toFixed(2)}</Text>
        <Text weight="plus">
          Margine: €{margin.toFixed(2)} ({marginPct.toFixed(1)}%)
        </Text>
        {snapshots.length === 0 && (
          <Text className="text-muted-foreground">Nessuno snapshot costo per questo ordine.</Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details",
})

export default OrderMarginWidget