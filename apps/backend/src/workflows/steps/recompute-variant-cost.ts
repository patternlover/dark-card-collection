import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { PROCUREMENT_MODULE } from "../../modules/procurement"
import ProcurementModuleService from "../../modules/procurement/service"

/**
 * Recomputes the weighted average cost of the in-stock quantities of each
 * variant and stores it in `variant.metadata.cost_of_goods_sold`.
 */
export const recomputeVariantCostStep = createStep(
  "recompute-variant-average-cost",
  async (
    input: { variantIds: string[] },
    { container },
  ): Promise<StepResponse<{ variantIds: string[] }>> => {
    const service: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)
    const productService = container.resolve(ModuleRegistrationName.PRODUCT)

    const distinct = [...new Set(input.variantIds)]
    for (const variantId of distinct) {
      const averageCost = await service.getAverageCost(variantId)
      const variant = (await productService.retrieveProductVariant(variantId, {
        select: ["id", "metadata"],
      })) as { id: string; metadata?: Record<string, unknown> | null }
      await productService.updateProductVariants(variantId, {
        metadata: {
          ...(variant.metadata ?? {}),
          cost_of_goods_sold: averageCost,
        },
      })
    }

    return new StepResponse({ variantIds: distinct })
  },
)