import { model } from "@medusajs/framework/utils"
import PurchaseLine from "./purchase-line"

/**
 * A purchase lot ("lotto"): one buying event with one or more lines.
 * Extra costs (shipping/fees) are allocated pro-rata over the lines (see `utils/cost.ts`).
 */
const PurchaseLot = model.define("purchase_lot", {
  id: model.id({ prefix: "lot" }).primaryKey(),
  purchase_date: model.dateTime(),
  source_type: model.enum([
    "newsstand",
    "supermarket",
    "shop",
    "online",
    "private",
    "other",
  ]),
  source_name: model.text().nullable(),
  extra_costs: model.float().default(0),
  notes: model.text().nullable(),
  /** URL of the purchase receipt (Google Drive), nullable. */
  receipt_url: model.text().nullable(),
  /** Derived: Σ (qty × unit_cost) + extra_costs. */
  total_cost: model.float().default(0),
  lines: model.hasMany(() => PurchaseLine, {
    mappedBy: "lot",
    onDelete: "cascade",
  }),
})

export default PurchaseLot