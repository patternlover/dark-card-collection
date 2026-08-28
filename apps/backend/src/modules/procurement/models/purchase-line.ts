import { model } from "@medusajs/framework/utils"
import PurchaseLot from "./purchase-lot"

/**
 * A purchase line inside a lot: a variant bought at a given unit cost.
 * `remaining_quantity` is consumed FIFO by sales (see `utils/cost.ts`).
 * `variant_id` references a product_variant (integration id, no DB link needed —
 * the procurement module resolves variant details via the product module).
 */
const PurchaseLine = model.define("purchase_line", {
  id: model.id({ prefix: "pline" }).primaryKey(),
  lot: model.belongsTo(() => PurchaseLot, { mappedBy: "lines" }),
  variant_id: model.text().index("IDX_purchase_line_variant_id"),
  variant_title: model.text().nullable(),
  variant_sku: model.text().nullable(),
  quantity: model.number(),
  unit_cost: model.float(),
  /** Derived: `unit_cost × (1 + extra_costs/subtotal)` (see `utils/cost.ts`). */
  effective_unit_cost: model.float(),
  /** Initial = quantity; consumed FIFO by sales. */
  remaining_quantity: model.number(),
})

export default PurchaseLine