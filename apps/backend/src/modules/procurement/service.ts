import { MedusaService } from "@medusajs/framework/utils"
import PurchaseLot from "./models/purchase-lot"
import PurchaseLine from "./models/purchase-line"
import {
  allocateFifo,
  computeAverageCost,
  FifoAllocation,
  roundMoney,
} from "./utils/cost"

/**
 * Procurement module service. Extends `MedusaService` for CRUD on `PurchaseLot`
 * and `PurchaseLine`, plus the bespoke costing/FIFO helpers.
 */
class ProcurementModuleService extends MedusaService({
  PurchaseLot,
  PurchaseLine,
}) {
  /**
   * FIFO: consume `quantity` units from the oldest lines of a variant.
   * Returns the allocations (with their effective costs) and updates
   * `remaining_quantity` on the affected lines.
   */
  async consumeFifo(
    variantId: string,
    quantity: number,
    sharedContext?: Parameters<typeof this.listPurchaseLines>[2],
  ): Promise<FifoAllocation[]> {
    const lines = await this.listPurchaseLines(
      { variant_id: variantId },
      { relations: ["lot"], take: 1000 },
      sharedContext,
    )

    const fifoLines = lines
      .filter((l) => Number(l.remaining_quantity ?? 0) > 0)
      .map((l) => ({
        lineId: l.id,
        effective_unit_cost: Number(l.effective_unit_cost ?? 0),
        remaining_quantity: Number(l.remaining_quantity ?? 0),
        purchase_date:
          (l.lot as { purchase_date?: Date | string } | undefined)?.purchase_date
            ? new Date(
                (l.lot as { purchase_date: Date | string }).purchase_date,
              ).toISOString()
            : null,
      }))

    const allocations = allocateFifo(fifoLines, quantity)

    const consumedById = new Map(
      allocations.map((a) => [a.lineId, a.quantity] as const),
    )
    await Promise.all(
      lines
        .filter((l) => consumedById.has(l.id))
        .map((l) =>
          this.updatePurchaseLines(
            {
              id: l.id,
              remaining_quantity: Math.max(
                0,
                Number(l.remaining_quantity ?? 0) - (consumedById.get(l.id) ?? 0),
              ),
            },
            sharedContext,
          ),
        ),
    )

    return allocations
  }

  /** Restore `quantity` units back on a variant's lines (FIFO inverse: newest first). */
  async restoreFifo(
    variantId: string,
    quantity: number,
    sharedContext?: Parameters<typeof this.listPurchaseLines>[2],
  ): Promise<void> {
    const lines = await this.listPurchaseLines(
      { variant_id: variantId },
      { relations: ["lot"], take: 1000 },
      sharedContext,
    )
    // Restore onto the most recent lines first.
    const sorted = [...lines].sort((a, b) => {
      const da = a.lot?.purchase_date ?? new Date(0)
      const db = b.lot?.purchase_date ?? new Date(0)
      return da > db ? -1 : 1
    })
    let remaining = quantity
    for (const line of sorted) {
      if (remaining <= 0) break
      const capacity =
        Number(line.quantity ?? 0) - Number(line.remaining_quantity ?? 0)
      if (capacity <= 0) continue
      const restore = Math.min(remaining, capacity)
      await this.updatePurchaseLines(
        {
          id: line.id,
          remaining_quantity: Number(line.remaining_quantity ?? 0) + restore,
        },
        sharedContext,
      )
      remaining -= restore
    }
  }

  /** Weighted average effective cost of the in-stock quantities of a variant. */
  async getAverageCost(
    variantId: string,
    sharedContext?: Parameters<typeof this.listPurchaseLines>[2],
  ): Promise<number> {
    const lines = await this.listPurchaseLines(
      { variant_id: variantId },
      { take: 1000 },
      sharedContext,
    )
    const inStock = lines
      .filter((l) => Number(l.remaining_quantity ?? 0) > 0)
      .map((l) => ({
        effective_unit_cost: Number(l.effective_unit_cost ?? 0),
        remaining_quantity: Number(l.remaining_quantity ?? 0),
      }))
    return roundMoney(computeAverageCost(inStock))
  }
}

export default ProcurementModuleService