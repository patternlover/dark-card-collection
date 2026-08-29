import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { PROCUREMENT_MODULE } from "../modules/procurement"
import ProcurementModuleService from "../modules/procurement/service"
import { roundMoney, weightedAverageSnapshot } from "../modules/procurement/utils/cost"

/**
 * Snapshot costo FIFO per gli ordini del canale website (checkout Medusa).
 * Gli ordini di vendita esterna sono già gestiti dal workflow
 * `recordExternalSale` (hanno `metadata.dcc_cost_snapshots` → skip).
 */
export default async function handleOrderPlaced({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event.data.id
  const orderModuleService = container.resolve(ModuleRegistrationName.ORDER)
  const procurement: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)

  const order = (await orderModuleService.retrieveOrder(orderId, {
    relations: ["items"],
  })) as {
    metadata?: Record<string, unknown> | null
    items?: Array<{ variant_id?: string; quantity?: number }>
  }

  // Guard: le vendite esterne hanno già gli snapshot (doppio consumo FIFO evitato).
  if (order.metadata?.dcc_cost_snapshots) return

  const items = (order.items ?? []).filter((i) => i.variant_id)
  if (items.length === 0) return

  const snapshots: Array<{
    variant_id: string
    quantity: number
    unit_cost_snapshot: number
  }> = []
  const variantIds: string[] = []

  for (const item of items) {
    const variantId = item.variant_id as string
    const quantity = Number(item.quantity ?? 0)
    if (quantity <= 0) continue
    const allocations = await procurement.consumeFifo(variantId, quantity)
    snapshots.push({
      variant_id: variantId,
      quantity,
      unit_cost_snapshot: roundMoney(weightedAverageSnapshot(allocations)),
    })
    variantIds.push(variantId)
  }

  if (snapshots.length === 0) return

  await orderModuleService.updateOrders(orderId, {
    metadata: { ...(order.metadata ?? {}), dcc_cost_snapshots: snapshots },
  })

  // Ricalcola il costo medio dei variants venduti.
  const productService = container.resolve(ModuleRegistrationName.PRODUCT)
  for (const variantId of [...new Set(variantIds)]) {
    const averageCost = await procurement.getAverageCost(variantId)
    const variant = (await productService.retrieveProductVariant(variantId, {
      select: ["id", "metadata"],
    })) as { metadata?: Record<string, unknown> | null }
    await productService.updateProductVariants(variantId, {
      metadata: {
        ...(variant.metadata ?? {}),
        cost_of_goods_sold: averageCost,
      },
    })
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}