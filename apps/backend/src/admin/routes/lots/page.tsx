"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"

interface LotLine {
  variant_id: string
  quantity: string
  unit_cost: string
}

interface Lot {
  id: string
  purchase_date: string
  source_type: string
  source_name: string | null
  extra_costs: number
  total_cost: number
  notes: string | null
  lines: Array<{ id: string; variant_id: string; quantity: number; unit_cost: number; effective_unit_cost: number; remaining_quantity: number }>
}

interface LotsResponse {
  lots: Lot[]
  count: number
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Errore ${res.status}`)
  }
  return res.json() as Promise<T>
}

const SOURCE_TYPES = ["newsstand", "supermarket", "shop", "online", "private", "other"]

function LotsPage() {
  const [lines, setLines] = useState<LotLine[]>([{ variant_id: "", quantity: "1", unit_cost: "" }])
  const [purchaseDate, setPurchaseDate] = useState("")
  const [sourceType, setSourceType] = useState("shop")
  const [sourceName, setSourceName] = useState("")
  const [extraCosts, setExtraCosts] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, refetch, isLoading } = useQuery<LotsResponse>({
    queryKey: ["admin-lots"],
    queryFn: () => api("/admin/lots"),
  })

  const updateLine = (index: number, field: keyof LotLine, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await api("/admin/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
          source_type: sourceType,
          source_name: sourceName || undefined,
          extra_costs: parseFloat(extraCosts) || 0,
          notes: notes || undefined,
          lines: lines
            .filter((l) => l.variant_id.trim())
            .map((l) => ({
              variant_id: l.variant_id.trim(),
              quantity: parseInt(l.quantity, 10) || 1,
              unit_cost: parseFloat(l.unit_cost) || 0,
            })),
        }),
      })
      setLines([{ variant_id: "", quantity: "1", unit_cost: "" }])
      setPurchaseDate("")
      setSourceName("")
      setExtraCosts("")
      setNotes("")
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Lotti (acquisti)</Heading>
      </div>

      <div className="px-6 py-4">
        <Heading level="h3">Nuovo lotto</Heading>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            Data acquisto
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="rounded-md border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fonte
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="rounded-md border px-2 py-1">
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Luogo / fornitore
            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="rounded-md border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Extra costs (€)
            <input type="number" step="0.01" value={extraCosts} onChange={(e) => setExtraCosts(e.target.value)} className="rounded-md border px-2 py-1" />
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Heading level="h3">Righe</Heading>
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px_100px_auto] gap-2">
              <input
                placeholder="variant_id (es. variant_...) o SKU"
                value={line.variant_id}
                onChange={(e) => updateLine(index, "variant_id", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="qty"
                value={line.quantity}
                onChange={(e) => updateLine(index, "quantity", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="costo unit."
                value={line.unit_cost}
                onChange={(e) => updateLine(index, "unit_cost", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <Button
                variant="danger"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                disabled={lines.length === 1}
              >
                ×
              </Button>
            </div>
          ))}
          <div>
            <Button variant="secondary" onClick={() => setLines((prev) => [...prev, { variant_id: "", quantity: "1", unit_cost: "" }])}>
              + Riga
            </Button>
          </div>
        </div>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          Note
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-md border px-2 py-1" />
        </label>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={submit} disabled={saving}>{saving ? "Salvataggio…" : "Registra lotto"}</Button>
          {error && <Text className="text-red-600">{error}</Text>}
        </div>
      </div>

      <div className="px-6 py-4">
        <Heading level="h3">Storico lotti ({data?.count ?? 0})</Heading>
        {isLoading ? (
          <Text>Caricamento…</Text>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {(data?.lots ?? []).map((lot) => (
              <div key={lot.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <Text weight="plus">
                    {new Date(lot.purchase_date).toLocaleDateString("it-IT")} — {lot.source_type}
                    {lot.source_name ? ` (${lot.source_name})` : ""}
                  </Text>
                  <Text weight="plus">totale €{Number(lot.total_cost).toFixed(2)}</Text>
                </div>
                <Text className="text-muted-foreground">
                  extra €{Number(lot.extra_costs).toFixed(2)} · {lot.lines.length} righe · {lot.notes ?? ""}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Lotti",
})

export default LotsPage