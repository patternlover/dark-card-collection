/**
 * Import storico Google Sheet (acquisti + vendite) in Medusa.
 *
 * Uso:
 *   npx medusa exec ./src/scripts/import-history/run.ts            # dry-run (default)
 *   COMMIT=1 npx medusa exec ./src/scripts/import-history/run.ts   # scrive sul DB
 *   IMPORT_DIR=.import   # dir con purchases.csv + sales.csv (default .import)
 *
 * Idempotente: salta lotti con [PUR-xxxx] già presente e ordini con
 * metadata.dcc_sale_id già presente. Rilanciabile in sicurezza.
 */
import fs from "fs"
import path from "path"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { PROCUREMENT_MODULE } from "../../modules/procurement"
import type ProcurementModuleService from "../../modules/procurement/service"
import { createPurchaseLotWorkflow } from "../../workflows/purchase-lot/create-purchase-lot"
import { recordExternalSaleWorkflow } from "../../workflows/sales/record-external-sale"
import {
  groupProducts,
  parsePurchases,
  parseSales,
  type ParsedPurchase,
  type ProductGroup,
} from "./parse"

interface QueryLike {
  graph: (q: Record<string, unknown>) => Promise<{ data: unknown[] }>
}

interface NamedNode {
  id: string
  name?: string
  title?: string
}

interface ProductNode {
  id: string
  title: string
  handle: string
  status: string
  collection_id?: string | null
  metadata?: Record<string, unknown> | null
  variants?: { id: string; sku?: string | null }[]
  categories?: { name?: string }[]
}

interface OrderNode {
  id: string
  metadata?: Record<string, unknown> | null
}

interface ProductServiceLike {
  listProductCategories: (f: Record<string, unknown>) => Promise<NamedNode[]>
  listCollections: (f: Record<string, unknown>) => Promise<NamedNode[]>
  createCollections: (
    d: { title: string; handle: string }[],
  ) => Promise<NamedNode[]>
  listProductOptions: (f: Record<string, unknown>) => Promise<NamedNode[]>
  listAndCountProductVariants: (
    f: Record<string, unknown>,
    c?: Record<string, unknown>,
  ) => Promise<[unknown[], number]>
}

interface OrderServiceLike {
  listOrders: (
    f: Record<string, unknown>,
    c?: Record<string, unknown>,
  ) => Promise<OrderNode[]>
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function uniqueHandle(base: string, taken: Set<string>): string {
  let h = base || "prodotto"
  let i = 2
  while (taken.has(h)) {
    h = `${base}-${i}`
    i++
  }
  taken.add(h)
  return h
}

const CHANNEL_BY_PLATFORM: Record<string, string> = {
  Vinted: "Vinted",
  eBay: "eBay",
  Cardmarket: "Cardmarket",
}

export default async ({ container }: { container: MedusaContainer }) => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (m: string) => void
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryLike
  const productService = container.resolve(
    ModuleRegistrationName.PRODUCT,
  ) as unknown as ProductServiceLike
  const orderService = container.resolve(
    ModuleRegistrationName.ORDER,
  ) as unknown as OrderServiceLike
  const procurement: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)

  const commit = process.env.COMMIT === "1"
  const dir = path.resolve(process.cwd(), process.env.IMPORT_DIR ?? ".import")
  const log = (m: string) => {
    logger.info(m)
    console.log(m)
  }

  log(`[import] dir=${dir} mode=${commit ? "COMMIT" : "DRY-RUN"}`)

  const purchasesCsv = fs.readFileSync(path.join(dir, "purchases.csv"), "utf8")
  const salesCsv = fs.readFileSync(path.join(dir, "sales.csv"), "utf8")

  const parsedP = parsePurchases(purchasesCsv)
  const parsedS = parseSales(salesCsv, parsedP.rows)
  for (const w of [...parsedP.warnings, ...parsedS.warnings]) log(`[warn] ${w}`)
  for (const s of parsedS.skipped) log(`[skip] ${s}`)
  const errors = [...parsedP.errors, ...parsedS.errors]
  if (errors.length > 0) {
    for (const e of errors) log(`[error] ${e}`)
    throw new Error(`Import bloccato: ${errors.length} errori di validazione`)
  }
  log(
    `[parse] ${parsedP.rows.length} lotti · ${parsedS.orders.length} ordini · ` +
      `${parsedS.orders.reduce((a, o) => a + o.units.length, 0)} unità vendute`,
  )

  // --- Riferimenti esistenti ---
  const [channelsRes, regionsRes, collections, categories, options, productsRes, lots, orders] =
    await Promise.all([
      query.graph({ entity: "sales_channel", fields: ["id", "name"] }),
      query.graph({ entity: "region", fields: ["id", "currency_code"] }),
      productService.listCollections({}),
      productService.listProductCategories({}),
      productService.listProductOptions({ title: "Default" }),
      query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "handle",
          "status",
          "collection_id",
          "metadata",
          "variants.id",
          "variants.sku",
          "categories.name",
        ],
        pagination: { take: 1000 },
      }),
      procurement.listPurchaseLots({}, { take: 1000 }),
      orderService.listOrders({}, { take: 1000 }),
    ])

  const channels = (channelsRes.data ?? []) as NamedNode[]
  const channelByName = new Map(channels.map((c) => [c.name ?? "", c.id]))
  const region = ((regionsRes.data ?? []) as { id: string; currency_code?: string }[]).find(
    (r) => (r.currency_code ?? "").toLowerCase() === "eur",
  )
  if (!region) throw new Error("Region EUR non trovata")
  const existingPurIds = new Set(
    (lots as { notes?: string | null }[])
      .map((l) => l.notes ?? "")
      .flatMap((n) => [...n.matchAll(/\[(PUR-\d+)\]/g)].map((m) => m[1])),
  )
  const existingSaleIds = new Set(
    orders
      .map((o) => (o.metadata as Record<string, unknown> | null)?.dcc_sale_id)
      .filter((v): v is string => typeof v === "string"),
  )

  const groups = groupProducts(parsedP.rows)
  log(
    `[catalogo] ${groups.length} prodotti distinti · ` +
      `${new Set(groups.map((g) => g.categoryName)).size} categorie · ` +
      `${new Set(groups.flatMap((g) => g.sets)).size} set`,
  )

  // --- Piano prodotti ---
  const products = (productsRes.data ?? []) as ProductNode[]
  const takenHandles = new Set(products.map((p) => p.handle))
  const collectionByTitle = new Map(
    collections.map((c) => [(c.title ?? "").toLowerCase(), c]),
  )
  const missingCollections = [
    ...new Set(groups.flatMap((g) => g.sets)),
  ].filter((s) => !collectionByTitle.has(s.toLowerCase()))
  const categoryByName = new Map(categories.map((c) => [(c.name ?? "").toLowerCase(), c]))
  const missingCategories = [...new Set(groups.map((g) => g.categoryName))].filter(
    (n) => !categoryByName.has(n.toLowerCase()),
  )

  // Match prodotti esistenti per titolo normalizzato.
  const productByTitle = new Map(
    products.map((p) => [p.title.trim().toLowerCase(), p]),
  )
  const variantByProductKey = new Map<string, string>()
  const productsToCreate: ProductGroup[] = []
  for (const g of groups) {
    const existing = productByTitle.get(g.name.trim().toLowerCase())
    const existingVariant = existing?.variants?.[0]?.id
    if (existing && existingVariant) {
      variantByProductKey.set(g.key, existingVariant)
    } else {
      productsToCreate.push(g)
    }
  }

  const lotsToCreate = parsedP.rows
    .filter((p) => !existingPurIds.has(p.purchase_id))
    .sort((a, b) => a.date.localeCompare(b.date))
  const ordersToCreate = parsedS.orders.filter((o) => !existingSaleIds.has(o.sale_id))

  log(
    `[piano] categorie da creare: ${missingCategories.length} · collezioni da creare: ` +
      `${missingCollections.length} · prodotti da creare: ${productsToCreate.length} ` +
      `(riuso: ${groups.length - productsToCreate.length}) · lotti da creare: ` +
      `${lotsToCreate.length} (skip: ${parsedP.rows.length - lotsToCreate.length}) · ` +
      `ordini da creare: ${ordersToCreate.length} (skip: ${parsedS.orders.length - ordersToCreate.length})`,
  )

  if (!commit) {
    log("[dry-run] NESSUNA scrittura. Rilancia con COMMIT=1 per scrivere.")
    log(`[dry-run] Prodotti nuovi: ${productsToCreate.map((g) => g.name).join(" | ")}`)
    return
  }

  // --- COMMIT ---
  for (const name of missingCategories) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ name, is_active: true }] },
    })
    const created = (result as NamedNode[])[0]
    categoryByName.set(name.toLowerCase(), created)
    log(`[commit] categoria: ${name}`)
  }
  if (missingCollections.length > 0) {
    const created = await productService.createCollections(
      missingCollections.map((title) => ({ title, handle: uniqueHandle(slugify(title), takenHandles) })),
    )
    for (const c of created) {
      collectionByTitle.set((c.title ?? "").toLowerCase(), c)
      log(`[commit] collezione: ${c.title}`)
    }
  }

  let defaultOption = options[0]
  if (!defaultOption) {
    const { result } = await createProductOptionsWorkflow(container).run({
      input: { product_options: [{ title: "Default", values: ["Default"] }] },
    })
    defaultOption = (result as NamedNode[])[0]
  }

  const [, variantCount] = await productService.listAndCountProductVariants({}, { take: 1 })
  let skuSeq = variantCount + 1
  const purchaseToVariant = new Map<string, string>()

  for (const g of productsToCreate) {
    const collection = collectionByTitle.get(g.sets[0].toLowerCase())
    const category = categoryByName.get(g.categoryName.toLowerCase())
    if (!collection) throw new Error(`Collezione mancante: ${g.sets[0]}`)
    if (!category) throw new Error(`Categoria mancante: ${g.categoryName}`)
    const handle = uniqueHandle(slugify(g.name), takenHandles)
    const sku = `DCC-${String(skuSeq).padStart(4, "0")}`
    skuSeq++
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: g.name,
            handle,
            status: ProductStatus.DRAFT,
            collection_id: collection.id,
            category_ids: [category.id],
            options: [{ id: defaultOption.id }],
            variants: [
              {
                title: "Default",
                sku,
                options: { Default: "Default" },
                manage_inventory: true,
              },
            ],
            metadata: {
              product_type: g.productType,
              language: g.language,
              condition: g.condition,
              set_names: g.sets,
              import_key: g.key,
            },
          },
        ],
      },
    })
    const created = (result as { id: string; variants?: { id: string }[] }[])[0]
    const variantId = created.variants?.[0]?.id
    if (!variantId) throw new Error(`Variante non creata per ${g.name}`)
    variantByProductKey.set(g.key, variantId)
    log(`[commit] prodotto: ${g.name} (${sku}, ${handle})`)
  }

  // Mappa PUR → variant (anche per i lotti già presenti da run precedenti).
  const keyByPurchase = new Map(parsedP.rows.map((p) => [p.purchase_id, p.productKey]))
  for (const p of parsedP.rows) {
    const v = variantByProductKey.get(p.productKey)
    if (v) purchaseToVariant.set(p.purchase_id, v)
  }
  if (purchaseToVariant.size !== parsedP.rows.length) {
    throw new Error("Alcuni acquisti non hanno una variante risolta")
  }

  const createdLotIds: string[] = []
  for (const p of lotsToCreate) {
    const variant_id = purchaseToVariant.get(p.purchase_id) as string
    const input = {
      purchase_date: p.date,
      source_type: p.source_type,
      source_name: p.source_name || undefined,
      extra_costs: p.extra_costs,
      notes: p.notes,
      lines: [{ variant_id, quantity: p.quantity, unit_cost: p.unit_cost }],
    }
    const { result } = await createPurchaseLotWorkflow(container).run({ input })
    createdLotIds.push((result as { lotId: string }).lotId)
    log(`[commit] lotto ${p.purchase_id}: ${p.product_name} ×${p.quantity}`)
  }

  const createdOrderIds: string[] = []
  for (const o of ordersToCreate) {
    const channelName = CHANNEL_BY_PLATFORM[o.platform] ?? "Altro"
    const channelId = channelByName.get(channelName)
    if (!channelId) throw new Error(`Sales channel mancante: ${channelName}`)
    // Raggruppa unità per variante+prezzo.
    const lines = new Map<string, { variant_id: string; quantity: number; unit_price: number }>()
    for (const u of o.units) {
      const pur: ParsedPurchase | undefined = parsedP.rows.find(
        (r) => r.purchase_id === u.purchase_id,
      )
      if (!pur) throw new Error(`Acquisto ${u.purchase_id} non trovato`)
      const variant_id = purchaseToVariant.get(u.purchase_id) as string
      const k = `${variant_id}|${u.unit_price}`
      const line = lines.get(k)
      if (line) line.quantity += 1
      else lines.set(k, { variant_id, quantity: 1, unit_price: u.unit_price })
    }
    const { result } = await recordExternalSaleWorkflow(container).run({
      input: {
        sales_channel_id: channelId,
        email: `${channelName.toLowerCase()}@darkcardcollection.com`,
        currency_code: "eur",
        region_id: region.id,
        order_metadata: {
          dcc_sale_id: o.sale_id,
          dcc_sale_date: o.sale_date,
          dcc_platform: o.platform,
        },
        items: [...lines.values()],
      },
    })
    createdOrderIds.push((result as { orderId: string }).orderId)
    log(`[commit] ordine ${o.sale_id}: ${o.units.length} unità (${o.platform})`)
  }

  // --- Verifica ---
  const allLines = (await procurement.listPurchaseLines({}, { take: 20000 })) as {
    variant_id: string
    quantity: number
    remaining_quantity?: number | null
  }[]
  let remaining = 0
  for (const l of allLines) remaining += Number(l.remaining_quantity ?? 0)
  const purchasedUnits = parsedP.rows.reduce((a, p) => a + p.quantity, 0)
  const soldUnits = parsedS.orders.reduce((a, o) => a + o.units.length, 0)
  const revenue = parsedS.orders.reduce(
    (a, o) => a + o.units.reduce((x, u) => x + u.unit_price, 0),
    0,
  )
  const cost = parsedP.rows.reduce((a, p) => a + p.quantity * p.unit_cost + p.extra_costs, 0)
  log(
    `[verify] lotti creati: ${createdLotIds.length} · ordini creati: ${createdOrderIds.length} · ` +
      `pezzi acquistati: ${purchasedUnits} · venduti: ${soldUnits} · ` +
      `residui attesi: ${purchasedUnits - soldUnits} · residui FIFO su DB: ${remaining} · ` +
      `costo totale €${cost.toFixed(2)} · ricavi €${revenue.toFixed(2)}`,
  )
  if (remaining !== purchasedUnits - soldUnits) {
    throw new Error("Quadratura giacenze fallita: vedi report sopra")
  }
}
