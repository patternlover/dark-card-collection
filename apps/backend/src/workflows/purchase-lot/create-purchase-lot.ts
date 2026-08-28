import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { PROCUREMENT_MODULE } from "../../modules/procurement"
import ProcurementModuleService from "../../modules/procurement/service"
import {
  computeEffectiveUnitCosts,
  roundMoney,
} from "../../modules/procurement/utils/cost"
import { resolveInventoryForVariants } from "../steps/resolve-inventory"
import { recomputeVariantCostStep } from "../steps/recompute-variant-cost"

export interface CreatePurchaseLotWorkflowInput {
  purchase_date: string
  source_type: "newsstand" | "supermarket" | "shop" | "online" | "private" | "other"
  source_name?: string
  extra_costs?: number
  notes?: string
  receipt_url?: string
  lines: {
    variant_id: string
    quantity: number
    unit_cost: number
  }[]
}

const createLotStep = createStep(
  "create-purchase-lot",
  async (input: CreatePurchaseLotWorkflowInput, { container }) => {
    const service: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)

    const extraCosts = input.extra_costs ?? 0
    const { effectiveCosts, totalCost } = computeEffectiveUnitCosts(
      input.lines,
      extraCosts,
    )

    const lot = await service.createPurchaseLots({
      purchase_date: new Date(input.purchase_date),
      source_type: input.source_type,
      source_name: input.source_name ?? null,
      extra_costs: extraCosts,
      notes: input.notes ?? null,
      receipt_url: input.receipt_url ?? null,
      total_cost: roundMoney(totalCost),
    })

    const lines = input.lines.map((line, i) => ({
      lot_id: lot.id,
      variant_id: line.variant_id,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      effective_unit_cost: roundMoney(effectiveCosts[i] ?? 0),
      remaining_quantity: line.quantity,
    }))
    const createdLines = await service.createPurchaseLines(lines)

    return new StepResponse(
      { lot, lines: createdLines },
      { lotId: lot.id },
    )
  },
  async (input, { container }) => {
    if (!input?.lotId) return
    const service: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)
    await service.deletePurchaseLots(input.lotId)
  },
)

const adjustInventoryStep = createStep(
  "adjust-inventory-for-lot",
  async (
    input: { lines: { variant_id: string; quantity: number }[] },
    { container },
  ) => {
    const inventoryService = container.resolve(ModuleRegistrationName.INVENTORY)
    const { inventoryByVariant, locationId } =
      await resolveInventoryForVariants(container, input.lines.map((l) => l.variant_id))

    if (!locationId) {
      throw new Error("No stock location configured for inventory adjustments")
    }

    const applied: Array<{ inventoryItemId: string; quantity: number }> = []
    for (const line of input.lines) {
      const inventoryItemId = inventoryByVariant.get(line.variant_id)
      if (!inventoryItemId) continue
      await inventoryService.adjustInventory(
        inventoryItemId,
        locationId,
        line.quantity,
      )
      applied.push({ inventoryItemId, quantity: line.quantity })
    }

    return new StepResponse(applied, { applied, locationId })
  },
  async (input, { container }) => {
    if (!input?.applied?.length) return
    const inventoryService = container.resolve(ModuleRegistrationName.INVENTORY)
    for (const adj of input.applied) {
      await inventoryService.adjustInventory(
        adj.inventoryItemId,
        input.locationId,
        -adj.quantity,
      )
    }
  },
)

export const createPurchaseLotWorkflow = createWorkflow(
  "create-purchase-lot",
  (input: CreatePurchaseLotWorkflowInput) => {
    const { lot } = createLotStep(input)
    adjustInventoryStep({ lines: input.lines })
    const variantIds = transform(input, (data) =>
      data.lines.map((line) => line.variant_id),
    )
    recomputeVariantCostStep({ variantIds })

    return new WorkflowResponse({ lotId: lot.id })
  },
)

export default createPurchaseLotWorkflow