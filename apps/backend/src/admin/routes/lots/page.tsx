"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"

interface LotLineInput {
  key: number
  variant_id: string
  quantity: string
  unit_cost: string
}

interface VariantOption {
  variant_id: string
  product_title: string
  variant_title: string | null
  sku: string | null
  status: string
  stock: number
}

interface LotLineView {
  id: string
  variant_id: string
  quantity: number
  unit_cost: number
  effective_unit_cost: number
  remaining_quantity: number
}

interface Lot {
  id: string
  purchase_date: string
  source_type: string
  source_name: string | null
  extra_costs: number
  total_cost: number
  notes: string | null
  lines: LotLineView[]
}

interface LotsResponse {
  lots: Lot[]
  count: number
}

interface OptionsResponse {
  options: VariantOption[]
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

function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function optionLabel(o: VariantOption): string {
  const variant =
    o.variant_title && o.variant_title !== "Default" ? ` — ${o.variant_title}` : ""
  const sku = o.sku ? ` · ${o.sku}` : ""
  return `${o.product_title}${variant}${sku}`
}

function LotsPage() {
  const { t } = useTranslation()
  const [lines, setLines] = useState<LotLineInput[]>([
    { key: 0, variant_id: "", quantity: "1", unit_cost: "" },
  ])
  const [nextKey, setNextKey] = useState(1)
  const [purchaseDate, setPurchaseDate] = useState(todayInput())
  const [sourceType, setSourceType] = useState("shop")
  const [sourceName, setSourceName] = useState("")
  const [extraCosts, setExtraCosts] = useState("")
  const [notes, setNotes] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data, refetch, isLoading } = useQuery<LotsResponse>({
    queryKey: ["admin-lots"],
    queryFn: () => api("/admin/lots"),
  })
  const { data: optionsData, isLoading: optionsLoading } = useQuery<OptionsResponse>({
    queryKey: ["admin-variant-options"],
    queryFn: () => api("/admin/dcc/variant-options"),
  })

  const options = useMemo(() => optionsData?.options ?? [], [optionsData])
  const labelByVariant = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of options) map.set(o.variant_id, optionLabel(o))
    return map
  }, [options])
  const filteredOptions = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => optionLabel(o).toLowerCase().includes(q))
  }, [options, productSearch])

  const parsed = useMemo(
    () =>
      lines.map((l) => ({
        ...l,
        qty: parseInt(l.quantity, 10),
        unit: parseFloat(l.unit_cost),
      })),
    [lines],
  )
  const subtotal = useMemo(
    () =>
      parsed.reduce(
        (acc, l) =>
          acc + (Number.isFinite(l.qty) && l.qty > 0 && Number.isFinite(l.unit) && l.unit >= 0
            ? l.qty * l.unit
            : 0),
        0,
      ),
    [parsed],
  )
  const totalQty = useMemo(
    () =>
      parsed.reduce(
        (acc, l) => acc + (Number.isFinite(l.qty) && l.qty > 0 ? l.qty : 0),
        0,
      ),
    [parsed],
  )
  const extra = parseFloat(extraCosts) || 0
  // Stessa formula del backend (effective_unit_cost pro-quota; se subtotale 0,
  // split uguale per unità): è solo anteprima, il calcolo ufficiale resta server-side.
  const factor = subtotal > 0 ? 1 + extra / subtotal : 0
  const effectiveFor = (qty: number, unit: number): number => {
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return 0
    if (subtotal > 0) return unit * factor
    return unit + (totalQty > 0 ? extra / totalQty : 0)
  }

  const updateLine = (key: number, field: keyof LotLineInput, value: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)))
  }

  const addLine = () => {
    setLines((prev) => [...prev, { key: nextKey, variant_id: "", quantity: "1", unit_cost: "" }])
    setNextKey((k) => k + 1)
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const picked = parsed.filter((l) => l.variant_id.trim())
      if (picked.length === 0) throw new Error(t("lots.errNoLines"))
      picked.forEach((l, i) => {
        if (!Number.isInteger(l.qty) || l.qty < 1)
          throw new Error(t("lots.errBadQty", { n: i + 1 }))
        if (!Number.isFinite(l.unit) || l.unit < 0)
          throw new Error(t("lots.errBadCost", { n: i + 1 }))
      })
      if (extraCosts.trim() && (!Number.isFinite(extra) || extra < 0))
        throw new Error(t("lots.errBadExtra"))

      await api("/admin/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchase_date: purchaseDate
            ? new Date(purchaseDate).toISOString()
            : new Date().toISOString(),
          source_type: sourceType,
          source_name: sourceName.trim() || undefined,
          extra_costs: extra,
          notes: notes.trim() || undefined,
          lines: picked.map((l) => ({
            variant_id: l.variant_id.trim(),
            quantity: l.qty,
            unit_cost: l.unit,
          })),
        }),
      })
      setLines([{ key: nextKey, variant_id: "", quantity: "1", unit_cost: "" }])
      setNextKey((k) => k + 1)
      setSourceName("")
      setExtraCosts("")
      setNotes("")
      setSuccess(t("lots.registered"))
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("lots.title")}</Heading>
      </div>

      <div className="px-6 py-4">
        <Heading level="h3">{t("lots.newLot")}</Heading>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            {t("lots.purchaseDate")}
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="rounded-md border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("lots.source")}
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="rounded-md border px-2 py-1"
            >
              {SOURCE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {t(`lots.source_${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("lots.placeOrSupplier")}
            <input
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="rounded-md border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("lots.extraCosts")}
            <input
              type="number"
              min="0"
              step="0.01"
              value={extraCosts}
              onChange={(e) => setExtraCosts(e.target.value)}
              className="rounded-md border px-2 py-1"
            />
            <span className="text-xs text-gray-500">{t("lots.extraCostsHint")}</span>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Heading level="h3">{t("lots.lines")}</Heading>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={t("lots.searchProduct")}
              className="rounded-md border px-2 py-1 text-sm"
            />
          </div>
          {optionsLoading ? (
            <Text>{t("common.loading")}</Text>
          ) : filteredOptions.length === 0 ? (
            <Text>{t("lots.noProductMatch")}</Text>
          ) : (
            lines.map((line, index) => (
              <div
                key={line.key}
                className="grid grid-cols-[1fr_80px_110px_110px_auto] items-center gap-2"
              >
                <select
                  value={line.variant_id}
                  onChange={(e) => updateLine(line.key, "variant_id", e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm"
                >
                  <option value="">— {t("lots.product")} —</option>
                  {filteredOptions.map((o) => (
                    <option key={o.variant_id} value={o.variant_id}>
                      {optionLabel(o)} ({t("lots.inStock")}: {o.stock}
                      {o.status !== "published" ? ` · ${t("lots.draft")}` : ""})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  aria-label={t("common.quantity")}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, "quantity", e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  aria-label={t("lots.unitCost")}
                  placeholder={t("lots.unitCost")}
                  value={line.unit_cost}
                  onChange={(e) => updateLine(line.key, "unit_cost", e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <Text className="text-sm text-gray-600">
                  {t("lots.effectiveCost")}: €
                  {effectiveFor(
                    parsed[index]?.qty ?? NaN,
                    parsed[index]?.unit ?? NaN,
                  ).toFixed(2)}
                </Text>
                <Button
                  variant="danger"
                  onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  disabled={lines.length === 1}
                >
                  ×
                </Button>
              </div>
            ))
          )}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={addLine}>
              {t("lots.addRow")}
            </Button>
            <Text weight="plus">
              {t("lots.lotTotal")}: €{(subtotal + extra).toFixed(2)}
            </Text>
          </div>
        </div>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          {t("common.notes")}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-md border px-2 py-1"
          />
        </label>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={submit} disabled={saving}>
            {saving ? t("common.saving") : t("lots.register")}
          </Button>
          {error && <Text className="text-red-600">{error}</Text>}
          {success && <Text className="text-green-600">{success}</Text>}
        </div>
      </div>

      <div className="px-6 py-4">
        <Heading level="h3">
          {t("lots.history")} ({data?.count ?? 0})
        </Heading>
        {isLoading ? (
          <Text>{t("common.loading")}</Text>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {(data?.lots ?? []).map((lot) => (
              <div key={lot.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <Text weight="plus">
                    {new Date(lot.purchase_date).toLocaleDateString("it-IT")} —{" "}
                    {t(`lots.source_${lot.source_type}`)}
                    {lot.source_name ? ` (${lot.source_name})` : ""}
                  </Text>
                  <Text weight="plus">
                    {t("common.total")} €{Number(lot.total_cost).toFixed(2)}
                  </Text>
                </div>
                <div className="mt-1 flex flex-col gap-0.5 text-gray-600">
                  {lot.lines.map((l) => (
                    <Text key={l.id}>
                      {labelByVariant.get(l.variant_id) ?? l.variant_id} × {l.quantity} —
                      eff. €{Number(l.effective_unit_cost).toFixed(2)} (
                      {t("lots.inStock")}: {l.remaining_quantity})
                    </Text>
                  ))}
                </div>
                {lot.notes ? <Text className="text-gray-500">{lot.notes}</Text> : null}
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
