import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROCUREMENT_MODULE } from "../../../../../modules/procurement"
import type ProcurementModuleService from "../../../../../modules/procurement/service"
import { roundMoney } from "../../../../../modules/procurement/utils/cost"

/**
 * Warehouse drill-down for a variant: remaining FIFO lines (with lot date and
 * effective costs) + the weighted average cost of the in-stock quantities.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const variantId = req.params.id as string
  const service: ProcurementModuleService = req.scope.resolve(PROCUREMENT_MODULE)

  const lines = await service.listPurchaseLines(
    { variant_id: variantId },
    { relations: ["lot"], take: 1000 },
  )

  const remaining = lines
    .filter((l) => Number(l.remaining_quantity ?? 0) > 0)
    .sort((a, b) =>
      String(a.lot?.purchase_date ?? "").localeCompare(
        String(b.lot?.purchase_date ?? ""),
      ),
    )
    .map((l) => ({
      line_id: l.id,
      lot_id: l.lot_id,
      purchase_date: l.lot?.purchase_date ?? null,
      quantity: l.quantity,
      unit_cost: l.unit_cost,
      effective_unit_cost: l.effective_unit_cost,
      remaining_quantity: l.remaining_quantity,
    }))

  res.json({
    variant_id: variantId,
    lines: remaining,
    average_cost: roundMoney(await service.getAverageCost(variantId)),
  })
}