/**
 * Listino sito dai dati inventario (Google Sheet).
 *
 * Uso:
 *   npx medusa exec ./src/scripts/import-history/listino.ts            # dry-run
 *   COMMIT=1 npx medusa exec ./src/scripts/import-history/listino.ts   # scrive
 *
 * Regole:
 * - prezzo = target_price del foglio (il più recente) oppure costo_max × 1.5
 *   sulle unità residue (margine ≥50% garantito);
 * - canale Website SOLO ai prodotti con unità LISTED residue (gli HOLD restano
 *   nascosti, con metadata.hold_until);
 * - thumbnail dalla prima image_url disponibile;
 * - idempotente via metadata.listino_applied (rilanciabile).
 */
import fs from "fs"
import path from "path"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from "@medusajs/framework/utils"
import { linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows"
import { roundMoney } from "../../modules/procurement/utils/cost"
import type ProcurementModuleService from "../../modules/procurement/service"
import { PROCUREMENT_MODULE } from "../../modules/procurement"
import { groupProducts, parseInventory, parsePurchases, type InventoryRow } from "./parse"

interface QueryLike {
  graph: (q: Record<string, unknown>) => Promise<{ data: unknown[] }>
}

interface ProductNode {
  id: string
  title: string
  status: string
  metadata?: Record<string, unknown> | null
  collection_id?: string | null
  variants?: { id: string; sku?: string | null }[]
  sales_channels?: { id: string }[]
}

interface PricingServiceLike {
  createPriceSets: (
    d: { prices: { amount: number; currency_code: string }[] }[],
  ) => Promise<{ id: string }[]>
}

interface KnexLike {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: { id: string }[] }>
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
function newLinkId(): string {
  let s = "pvps_"
  for (let i = 0; i < 26; i++) {
    s += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)]
  }
  return s
}

interface PlanRow {
  name: string
  variantId: string
  productId: string
  remaining: number
  avgCost: number
  maxCost: number
  price: number
  priceSource: "target" | "computed"
  listable: boolean
  hasListedUnits: boolean
  allHold: boolean
  image: string
  holdUntil: string | null
  skipReason: string | null
  alreadyApplied: boolean
}

export default async ({ container }: { container: MedusaContainer }) => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (m: string) => void
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryLike
  const procurement: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)
  const commit = process.env.COMMIT === "1"
  const dir = path.resolve(process.cwd(), process.env.IMPORT_DIR ?? ".import")
  const log = (m: string) => {
    logger.info(m)
    console.log(m)
  }
  log(`[listino] mode=${commit ? "COMMIT" : "DRY-RUN"}`)

  const parsedP = parsePurchases(fs.readFileSync(path.join(dir, "purchases.csv"), "utf8"))
  const parsedI = parseInventory(fs.readFileSync(path.join(dir, "inventory.csv"), "utf8"))
  const errors = [...parsedP.errors, ...parsedI.errors]
  if (errors.length > 0) {
    for (const e of errors) log(`[error] ${e}`)
    throw new Error(`Listino bloccato: ${errors.length} errori di validazione`)
  }
  for (const w of parsedI.warnings) log(`[warn] ${w}`)

  const dateByPurchase = new Map(parsedP.rows.map((p) => [p.purchase_id, p.date]))
  const groups = groupProducts(parsedP.rows)
  const rowsByKey = new Map<string, InventoryRow[]>()
  for (const r of parsedI.rows) {
    const arr = rowsByKey.get(r.productKey) ?? []
    arr.push(r)
    rowsByKey.set(r.productKey, arr)
  }

  const productsRes = await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "metadata", "variants.id", "sales_channels.id"],
    pagination: { take: 1000 },
  })
  const products = (productsRes.data ?? []) as ProductNode[]
  const channelsRes = await query.graph({ entity: "sales_channel", fields: ["id", "name"] })
  const website = ((channelsRes.data ?? []) as { id: string; name?: string }[]).find(
    (c) => c.name === "Website",
  )
  if (!website) throw new Error("Sales channel Website non trovato")

  const lines = (await procurement.listPurchaseLines({}, { take: 20000 })) as {
    variant_id: string
    remaining_quantity?: number | null
    effective_unit_cost?: number | null
  }[]
  // Per variante: unità residue + costi (per riga con giacenza).
  const remainingUnits = new Map<string, { qty: number; cost: number }[]>()
  for (const l of lines) {
    const qty = Number(l.remaining_quantity ?? 0)
    if (qty > 0) {
      const arr = remainingUnits.get(l.variant_id) ?? []
      arr.push({ qty, cost: Number(l.effective_unit_cost ?? 0) })
      remainingUnits.set(l.variant_id, arr)
    }
  }

  const byImportKey = new Map(
    products
      .filter((p) => typeof (p.metadata as Record<string, unknown> | null)?.import_key === "string")
      .map((p) => [(p.metadata as Record<string, unknown>).import_key as string, p]),
  )
  const byTitle = new Map(products.map((p) => [p.title.trim().toLowerCase(), p]))

  const plan: PlanRow[] = []
  for (const g of groups) {
    const product = byImportKey.get(g.key) ?? byTitle.get(g.name.trim().toLowerCase())
    if (!product || !product.variants?.[0]) {
      log(`[warn] prodotto non trovato su DB: ${g.name}`)
      continue
    }
    const variantId = product.variants[0].id
    const units = remainingUnits.get(variantId) ?? []
    const remaining = units.reduce((a, u) => a + u.qty, 0)
    const rows = rowsByKey.get(g.key) ?? []
    const byState = (s: string) => rows.filter((r) => r.state === s).length
    log(
      `[debug] ${g.name}: foglio righe=${rows.length} (SOLD=${byState("SOLD")} LISTED=${byState("LISTED")} HOLD=${byState("HOLD")}) Medusa residui=${remaining}`,
    )
    const listed = rows.filter((r) => r.state === "LISTED")
    const hold = rows.filter((r) => r.state === "HOLD")
    const targets = [...new Set(rows.map((r) => r.target_price).filter((t): t is number => t !== null))]
    const latestTarget = targets.length
      ? rows
          .filter((r) => r.target_price !== null)
          .sort((a, b) =>
            (dateByPurchase.get(b.purchase_id) ?? "").localeCompare(
              dateByPurchase.get(a.purchase_id) ?? "",
            ),
          )[0].target_price as number
      : null
    if (targets.length > 1) {
      log(`[warn] ${g.name}: più target ${targets.join("/")} → uso il più recente (${latestTarget})`)
    }
    const avgCost = remaining
      ? units.reduce((a, u) => a + u.qty * u.cost, 0) / remaining
      : 0
    const maxCost = units.length ? Math.max(...units.map((u) => u.cost)) : 0
    const price = latestTarget ?? roundMoney(maxCost * 1.5)
    if (latestTarget !== null && latestTarget < roundMoney(maxCost * 1.5) && remaining > 0) {
      log(`[warn] ${g.name}: target €${latestTarget.toFixed(2)} sotto costo×1.5 (€${roundMoney(maxCost * 1.5).toFixed(2)}) — vince il target`)
    }
    const image = rows.find((r) => r.image_url)?.image_url ?? ""
    const holdUntil = hold.length
      ? hold.map((r) => r.hold_end_date ?? "").sort().reverse()[0] || null
      : null
    const hasListedUnits = listed.length > 0
    const allHold = rows.length > 0 && rows.every((r) => r.state === "HOLD")
    const sheetNonSold = rows.filter((r) => r.state !== "SOLD").length
    if (sheetNonSold !== remaining) {
      log(
        `[warn] ${g.name}: foglio non-SOLD=${sheetNonSold} ma residui Medusa=${remaining} (vendite senza prezzo / stati non aggiornati)`,
      )
    }
    const alreadyApplied =
      (product.metadata as Record<string, unknown> | null)?.listino_applied === true
    plan.push({
      name: g.name,
      variantId,
      productId: product.id,
      remaining,
      avgCost: roundMoney(avgCost),
      maxCost: roundMoney(maxCost),
      price,
      priceSource: latestTarget !== null ? "target" : "computed",
      listable: remaining > 0 && hasListedUnits,
      hasListedUnits,
      allHold,
      image,
      holdUntil,
      skipReason:
        remaining === 0
          ? "esaurito"
          : allHold
            ? "tutto in HOLD (nascosto)"
            : !hasListedUnits
              ? "nessuna unità LISTED"
              : null,
      alreadyApplied,
    })
  }

  log("=== PIANO LISTINO ===")
  for (const p of plan) {
    log(
      `- ${p.name}: stock=${p.remaining} costo medio €${p.avgCost.toFixed(2)} max €${p.maxCost.toFixed(2)} → ` +
        `prezzo €${p.price.toFixed(2)} (${p.priceSource})` +
        (p.listable ? " · CANALE Website" : ` · nascosto (${p.skipReason})`) +
        (p.image ? " · img" : " · NO img") +
        (p.alreadyApplied ? " · [già applicato: skip]" : ""),
    )
  }
  if (!commit) {
    log("[dry-run] NESSUNA scrittura. Rilancia con COMMIT=1 per applicare.")
    return
  }

  const pricing = container.resolve(ModuleRegistrationName.PRICING) as unknown as PricingServiceLike
  const knex = container.resolve("__pg_connection__") as unknown as {
    raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
  }
  const productService = container.resolve(ModuleRegistrationName.PRODUCT) as unknown as {
    updateProducts: (selector: unknown, data: unknown) => Promise<unknown>
  }

  // Price set già collegati (idempotenza reale, oltre metadata.listino_applied).
  const linkedRes = await knex.raw(
    `SELECT variant_id FROM product_variant_price_set WHERE deleted_at IS NULL`,
  )
  const withPrice = new Set((linkedRes.rows ?? []).map((r) => String(r.variant_id)))

  for (const p of plan) {
    if (p.remaining === 0 || p.alreadyApplied) {
      log(`[skip] ${p.name}: ${p.remaining === 0 ? "esaurito" : "già applicato"}`)
      continue
    }
    const current = products.find((x) => x.id === p.productId)
    const existingMeta = (current?.metadata ?? {}) as Record<string, unknown>
    const linkedChannel = (current?.sales_channels ?? []).some((c) => c.id === website.id)
    await productService.updateProducts(
      { id: p.productId },
      {
        ...(p.image ? { thumbnail: p.image } : {}),
        metadata: {
          ...existingMeta,
          ...(p.holdUntil ? { hold_until: p.holdUntil } : {}),
          listino_price: p.price,
          listino_applied: true,
        },
      },
    )
    if (!withPrice.has(p.variantId)) {
      const [priceSet] = await pricing.createPriceSets([
        { prices: [{ amount: Math.round(p.price * 100), currency_code: "eur" }] },
      ])
      // Link variante ↔ price set via SQL (link.create è ambiguo tra i moduli).
      await knex.raw(
        `INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [newLinkId(), p.variantId, priceSet.id],
      )
    }
    if (p.listable && !linkedChannel) {
      await linkProductsToSalesChannelWorkflow(container).run({
        input: { id: website.id, add: [p.productId] },
      })
    }
    log(`[commit] ${p.name}: €${p.price.toFixed(2)}${p.listable ? " + Website" : " (nascosto)"}`)
  }
  log("[listino] applicato. Verifica shop/feed per i prodotti listati.")
}
