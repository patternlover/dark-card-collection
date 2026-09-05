/**
 * Mapping + validazione degli export Google Sheet (acquisti e vendite) verso il
 * dominio Medusa/procurement. Funzioni pure: nessun accesso al DB (testabili).
 *
 * Regole prodotto (identità catalogo): nome + categoria + combo-set + lingua +
 * condizione. Differenze di acquisto (fornitore/prezzo/data) vivono nei lotti.
 */
import { parseCsv } from "./csv"

export type SourceType =
  | "newsstand"
  | "supermarket"
  | "shop"
  | "online"
  | "private"
  | "other"

export interface ParsedPurchase {
  purchase_id: string
  date: string
  product_name: string
  category: string
  categoryName: string
  productType: "product" | "card"
  language: string
  condition: string
  sets: string[]
  source_type: SourceType
  source_name: string
  quantity: number
  unit_cost: number
  extra_costs: number
  payment_method: string
  location: string
  notes: string
  productKey: string
}

export interface ParsedSaleUnit {
  sale_id: string
  sale_date: string
  platform: string
  purchase_id: string
  unit_index: number
  unit_price: number
}

export interface ParsedSaleOrder {
  sale_id: string
  sale_date: string
  platform: string
  units: ParsedSaleUnit[]
}

export interface ProductGroup {
  key: string
  name: string
  categoryName: string
  productType: "product" | "card"
  language: string
  condition: string
  sets: string[]
  purchase_ids: string[]
  totalQty: number
}

/** Correzioni note sui dati (typo nel foglio), applicate con warning esplicito. */
const KNOWN_ITEM_FIXES: Record<string, string> = {
  // PUR-0022 ha qty 1 (solo -01 esiste); il prezzo coincide con Palkia €50.
  "PUR-0022-07": "PUR-0022-01",
}

/** Categorie normalizzate (etichette incoerenti nel foglio). */
const CATEGORY_FIXES: Record<string, string> = {
  // Unica riga "Fascio di Busti" marcata Collection; le altre 5 sono Bundle.
  "PUR-0016": "Bundle",
}

/** Set unificati per prodotto (righe con combo diverse ma stesso articolo). */
const SETS_FIXES: { match: RegExp; sets: string[] }[] = [
  {
    // Tutte le "Serie 3" con la combo di maggioranza (31/43 pezzi).
    match: /serie 3/i,
    sets: ["CRI - Megaevoluzione - Caos Nascente", "PBL - Megaevoluzione - Buio Pesto"],
  },
]

/** "€ 1.234,56" | "€ 54,90" | "-€ 5,00" | "22,8" → numero. */
export function parseEuro(raw: string): number {
  let s = raw.trim().replace(/€/g, "").replace(/\s+/g, "")
  if (s === "" || s === "-") return 0
  const negative = s.startsWith("-")
  if (negative) s = s.slice(1)
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (s.includes(",")) {
    s = s.replace(",", ".")
  }
  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error(`Importo non valido: "${raw}"`)
  return negative ? -n : n
}

/** "03/07/2026" → "2026-07-03T00:00:00.000Z". */
export function parseSheetDate(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) throw new Error(`Data non valida: "${raw}" (atteso GG/MM/AAAA)`)
  const [, dd, mm, yyyy] = m
  const iso = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)))
  if (
    iso.getUTCFullYear() !== Number(yyyy) ||
    iso.getUTCMonth() !== Number(mm) - 1 ||
    iso.getUTCDate() !== Number(dd)
  ) {
    throw new Error(`Data inesistente: "${raw}"`)
  }
  return iso.toISOString()
}

/** "A, B" → ["A", "B"]; "-" → []. */
export function splitSets(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s !== "" && s !== "-")
}

const norm = (s: string): string => s.trim().replace(/\s+/g, " ")

export function categoryNameOf(category: string): string {
  const c = norm(category).toUpperCase()
  if (c === "CARD") return "Singole"
  return norm(category)
}

export function mapSourceType(sellerName: string, platform: string): SourceType {
  const seller = sellerName.toLowerCase()
  if (platform.trim().toLowerCase() === "site") return "online"
  if (/amazon/.test(seller)) return "online"
  if (/edicola|tabaccheria/.test(seller)) return "newsstand"
  if (/ipermercato|interspar|eurospar|supermerc|despar|conad|esselunga/.test(seller))
    return "supermarket"
  if (/emisfero|centro commerciale|galleria|quadrivio|risparmio casa|funside|game|store|shop|edicola/i.test(seller))
    return "shop"
  if (/grava|marchese/.test(seller)) return "private"
  if (seller.trim() === "" || seller === "-") return "other"
  return "other"
}

export function productKeyOf(p: {
  product_name: string
  categoryName: string
  sets: string[]
  language: string
  condition: string
}): string {
  return [norm(p.product_name), p.categoryName, p.sets.join("+"), p.language, p.condition]
    .join(" | ")
    .toLowerCase()
}

export interface ParseResult<T> {
  rows: T[]
  warnings: string[]
  errors: string[]
}

const PURCHASE_COLS = {
  id: 0,
  date: 1,
  productName: 2,
  category: 3,
  language: 4,
  set: 5,
  condition: 6,
  platform: 7,
  seller: 8,
  quantity: 9,
  unitaryNet: 10,
  shippingFee: 11,
  otherFees: 12,
  netPrice: 13,
  grossPrice: 14,
  unitaryGross: 15,
  paymentMethod: 16,
  location: 17,
  receipt: 18,
  notes: 19,
} as const

export function parsePurchases(csvText: string): ParseResult<ParsedPurchase> {
  const warnings: string[] = []
  const errors: string[] = []
  const rows = parseCsv(csvText)
  const purchases: ParsedPurchase[] = []
  const seen = new Set<string>()

  for (const cells of rows.slice(1)) {
    const id = norm(cells[PURCHASE_COLS.id] ?? "")
    if (id === "" || /^enter\b/i.test(id) || id.toLowerCase() === "purchase_id") continue
    try {
      const date = parseSheetDate(cells[PURCHASE_COLS.date] ?? "")
      const product_name = norm(cells[PURCHASE_COLS.productName] ?? "")
      let category = norm(cells[PURCHASE_COLS.category] ?? "")
      if (CATEGORY_FIXES[id] && CATEGORY_FIXES[id] !== category) {
        warnings.push(`${id}: categoria "${category}" normalizzata in "${CATEGORY_FIXES[id]}"`)
        category = CATEGORY_FIXES[id]
      }
      const languageRaw = norm(cells[PURCHASE_COLS.language] ?? "").toUpperCase()
      const conditionRaw = norm(cells[PURCHASE_COLS.condition] ?? "").toUpperCase()
      let sets = splitSets(cells[PURCHASE_COLS.set] ?? "")
      for (const fix of SETS_FIXES) {
        if (
          fix.match.test(product_name) &&
          sets.join("+").toLowerCase() !== fix.sets.join("+").toLowerCase()
        ) {
          warnings.push(`${id}: set unificati in "${fix.sets.join(" + ")}"`)
          sets = [...fix.sets]
        }
      }
      const platform = norm(cells[PURCHASE_COLS.platform] ?? "")
      const seller = norm(cells[PURCHASE_COLS.seller] ?? "")
      const quantity = parseInt(norm(cells[PURCHASE_COLS.quantity] ?? ""), 10)
      const unitaryNet = parseEuro(cells[PURCHASE_COLS.unitaryNet] ?? "")
      const shippingFee = parseEuro(cells[PURCHASE_COLS.shippingFee] ?? "")
      const otherFees = parseEuro(cells[PURCHASE_COLS.otherFees] ?? "")
      const netPrice = parseEuro(cells[PURCHASE_COLS.netPrice] ?? "")
      const grossPrice = parseEuro(cells[PURCHASE_COLS.grossPrice] ?? "")
      const unitaryGross = parseEuro(cells[PURCHASE_COLS.unitaryGross] ?? "")
      const payment_method = norm(cells[PURCHASE_COLS.paymentMethod] ?? "")
      const location = norm(cells[PURCHASE_COLS.location] ?? "")
      const notes = norm(cells[PURCHASE_COLS.notes] ?? "")

      if (!product_name) throw new Error("nome prodotto mancante")
      if (!Number.isInteger(quantity) || quantity < 1)
        throw new Error(`quantità non valida: "${cells[PURCHASE_COLS.quantity]}"`)
      if (sets.length === 0) throw new Error("set mancante")
      if (seen.has(id)) throw new Error(`purchase_id duplicato: ${id}`)
      seen.add(id)

      // Quadratura riga: net == qty × unitary_net + fee.
      const expectedNet = quantity * unitaryNet + shippingFee + otherFees
      if (Math.abs(expectedNet - netPrice) > 0.011) {
        warnings.push(
          `${id}: net_price €${netPrice.toFixed(2)} ≠ qty×unitary+fee €${expectedNet.toFixed(2)}`,
        )
      }
      if (Math.abs(netPrice - grossPrice) > 0.011) {
        warnings.push(`${id}: net (€${netPrice.toFixed(2)}) ≠ gross (€${grossPrice.toFixed(2)})`)
      }

      const isCard = category.toUpperCase() === "CARD"
      const language = languageRaw === "ITA" ? "italian" : languageRaw.toLowerCase()
      const condition = conditionRaw === "SEALED" ? "new" : conditionRaw.toLowerCase()
      const categoryName = categoryNameOf(category)
      const key = productKeyOf({
        product_name,
        categoryName,
        sets,
        language,
        condition,
      })

      const extra = shippingFee + otherFees
      const noteParts = [`[${id}]`]
      if (payment_method && payment_method !== "-") noteParts.push(`pagamento: ${payment_method}`)
      if (location && location !== "-") noteParts.push(`luogo: ${location}`)
      if (notes && notes !== "-") noteParts.push(notes)

      purchases.push({
        purchase_id: id,
        date,
        product_name,
        category,
        categoryName,
        productType: isCard ? "card" : "product",
        language,
        condition,
        sets,
        source_type: mapSourceType(seller, platform),
        source_name: seller,
        quantity,
        unit_cost: unitaryGross,
        extra_costs: extra,
        payment_method,
        location,
        notes: noteParts.join(" · "),
        productKey: key,
      })
    } catch (e) {
      errors.push(`${id || "(riga senza id)"}: ${e instanceof Error ? e.message : e}`)
    }
  }

  return { rows: purchases, warnings, errors }
}

const SALE_COLS = {
  saleId: 0,
  itemId: 1,
  listingDate: 2,
  saleDate: 3,
  platform: 4,
  unitaryGross: 5,
  platformFee: 6,
  paymentFee: 7,
  shippingFee: 8,
  grossPrice: 9,
  salePrice: 10,
  profit: 11,
  roi: 12,
} as const

export interface SalesParse {
  orders: ParsedSaleOrder[]
  skipped: string[]
  warnings: string[]
  errors: string[]
}

export function parseSales(
  csvText: string,
  purchases: ParsedPurchase[],
): SalesParse {
  const warnings: string[] = []
  const errors: string[] = []
  const skipped: string[] = []
  const byPurchase = new Map(purchases.map((p) => [p.purchase_id, p]))
  const soldUnits = new Set<string>()
  const byOrder = new Map<string, ParsedSaleOrder>()

  for (const cells of parseCsv(csvText).slice(1)) {
    const saleId = norm(cells[SALE_COLS.saleId] ?? "")
    let itemId = norm(cells[SALE_COLS.itemId] ?? "")
    if (saleId === "" || itemId === "" || /^enter\b/i.test(itemId)) continue

    if (KNOWN_ITEM_FIXES[itemId]) {
      warnings.push(`${saleId}: item_id ${itemId} corretto in ${KNOWN_ITEM_FIXES[itemId]}`)
      itemId = KNOWN_ITEM_FIXES[itemId]
    }

    const salePriceRaw = norm(cells[SALE_COLS.salePrice] ?? "")
    if (salePriceRaw === "" || /^enter\b/i.test(salePriceRaw)) {
      skipped.push(`${saleId} (${itemId}): senza sale_price — non importato come vendita`)
      continue
    }

    try {
      const m = itemId.match(/^(PUR-\d+)-(\d+)$/)
      if (!m) throw new Error(`item_id non valido: "${itemId}"`)
      const [, purchaseId, unitStr] = m
      const unitIndex = parseInt(unitStr, 10)
      const purchase = byPurchase.get(purchaseId)
      if (!purchase) throw new Error(`acquisto ${purchaseId} non trovato negli acquisti`)
      if (unitIndex < 1 || unitIndex > purchase.quantity)
        throw new Error(
          `unità ${unitIndex} fuori range (qty ${purchase.quantity} di ${purchaseId})`,
        )
      const unitKey = `${purchaseId}-${unitIndex}`
      if (soldUnits.has(unitKey)) throw new Error(`unità ${unitKey} venduta due volte`)
      soldUnits.add(unitKey)

      const saleDate = parseSheetDate(cells[SALE_COLS.saleDate] ?? "")
      const platform = norm(cells[SALE_COLS.platform] ?? "")
      const saleUnitary = parseEuro(cells[SALE_COLS.unitaryGross] ?? "")
      const salePrice = parseEuro(salePriceRaw)
      if (Math.abs(saleUnitary - purchase.unit_cost) > 0.011) {
        warnings.push(
          `${saleId}: costo unitario vendita €${saleUnitary.toFixed(2)} ≠ acquisto €${purchase.unit_cost.toFixed(2)} (${purchaseId})`,
        )
      }

      const unit: ParsedSaleUnit = {
        sale_id: saleId,
        sale_date: saleDate,
        platform,
        purchase_id: purchaseId,
        unit_index: unitIndex,
        unit_price: salePrice,
      }
      const order = byOrder.get(saleId)
      if (order) {
        if (order.platform !== platform)
          warnings.push(`${saleId}: piattaforme miste (${order.platform} + ${platform})`)
        order.units.push(unit)
      } else {
        byOrder.set(saleId, { sale_id: saleId, sale_date: saleDate, platform, units: [unit] })
      }
    } catch (e) {
      errors.push(`${saleId} (${itemId}): ${e instanceof Error ? e.message : e}`)
    }
  }

  const orders = [...byOrder.values()].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  )
  return { orders, skipped, warnings, errors }
}

export function groupProducts(purchases: ParsedPurchase[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const p of purchases) {
    const g = groups.get(p.productKey)
    if (g) {
      g.purchase_ids.push(p.purchase_id)
      g.totalQty += p.quantity
    } else {
      groups.set(p.productKey, {
        key: p.productKey,
        name: p.product_name,
        categoryName: p.categoryName,
        productType: p.productType,
        language: p.language,
        condition: p.condition,
        sets: p.sets,
        purchase_ids: [p.purchase_id],
        totalQty: p.quantity,
      })
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "it"))
}
