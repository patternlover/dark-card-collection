import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROCUREMENT_MODULE } from "../../../../modules/procurement"
import type ProcurementModuleService from "../../../../modules/procurement/service"

interface ProductNode {
  id: string
  title: string
  status: string
  variants?: Array<{ id: string; title?: string | null; sku?: string | null }>
}

interface PurchaseLineNode {
  variant_id: string
  remaining_quantity?: number | null
}

export interface VariantOption {
  variant_id: string
  product_title: string
  variant_title: string | null
  sku: string | null
  status: string
  /** Giacenza FIFO (somma dei remaining delle righe lotto). */
  stock: number
}

/**
 * Opzioni per i selettori prodotto delle pagine Admin custom (Lotti, Vendite):
 * ogni variante con nome prodotto leggibile (mai id grezzi) + giacenza FIFO.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query") as {
    graph: (q: unknown) => Promise<{ data: unknown }>
  }
  const service: ProcurementModuleService = req.scope.resolve(PROCUREMENT_MODULE)

  const [productsRes, lines] = await Promise.all([
    query.graph({
      entity: "product",
      fields: ["id", "title", "status", "variants.id", "variants.title", "variants.sku"],
      pagination: { take: 1000 },
    }),
    service.listPurchaseLines({}, { take: 10000 }),
  ])

  const stockByVariant = new Map<string, number>()
  for (const line of lines as PurchaseLineNode[]) {
    const remaining = Number(line.remaining_quantity ?? 0)
    if (remaining > 0) {
      stockByVariant.set(
        line.variant_id,
        (stockByVariant.get(line.variant_id) ?? 0) + remaining,
      )
    }
  }

  const products = ((productsRes.data ?? []) as ProductNode[]).filter(
    (p) => Array.isArray(p.variants) && p.variants.length > 0,
  )
  const options: VariantOption[] = []
  for (const p of products) {
    for (const v of p.variants ?? []) {
      options.push({
        variant_id: v.id,
        product_title: p.title,
        variant_title: v.title ?? null,
        sku: v.sku ?? null,
        status: p.status,
        stock: stockByVariant.get(v.id) ?? 0,
      })
    }
  }
  options.sort((a, b) => a.product_title.localeCompare(b.product_title, "it"))

  res.json({ options, count: options.length })
}
