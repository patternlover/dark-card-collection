import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { createOrderWorkflow } from "@medusajs/medusa/core-flows"
import { PROCUREMENT_MODULE } from "../../modules/procurement"
import ProcurementModuleService from "../../modules/procurement/service"
import {
  FifoAllocation,
  roundMoney,
  weightedAverageSnapshot,
} from "../../modules/procurement/utils/cost"
import { resolveInventoryForVariants } from "../steps/resolve-inventory"
import { recomputeVariantCostStep } from "../steps/recompute-variant-cost"

export interface RecordExternalSaleWorkflowInput {
  sales_channel_id: string
  email: string
  currency_code?: string
  region_id?: string
  shipping?: number
  tax?: number
  customer_username?: string
  items: {
    variant_id: string
    quantity: number
    unit_price: number
  }[]
}

interface VariantInfo {
  id: string
  title: string
  sku: string | null
}

const fetchVariantDetailsStep = createStep(
  "fetch-variant-details",
  async (
    input: { variantIds: string[] },
    { container },
  ): Promise<StepResponse<VariantInfo[]>> => {
    const productService = container.resolve(ModuleRegistrationName.PRODUCT)
    const variants = (await productService.listProductVariants(
      { id: input.variantIds },
      { select: ["id", "title", "sku"] },
    )) as Array<{ id: string; title?: string | null; sku?: string | null }>
    return new StepResponse(
      variants.map((v) => ({
        id: v.id,
        title: v.title ?? "Prodotto",
        sku: v.sku ?? null,
      })),
    )
  },
)

const allocateFifoSaleStep = createStep(
  "allocate-fifo-for-sale",
  async (
    input: { items: { variant_id: string; quantity: number }[] },
    { container },
  ) => {
    const service: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)

    const perItem: Array<{
      variant_id: string
      quantity: number
      allocations: FifoAllocation[]
      snapshot: number
    }> = []
    for (const item of input.items) {
      const allocations = await service.consumeFifo(item.variant_id, item.quantity)
      perItem.push({
        variant_id: item.variant_id,
        quantity: item.quantity,
        allocations,
        snapshot: roundMoney(weightedAverageSnapshot(allocations)),
      })
    }

    return new StepResponse(perItem, perItem)
  },
  async (perItem, { container }) => {
    const service: ProcurementModuleService = container.resolve(PROCUREMENT_MODULE)
    for (const item of perItem ?? []) {
      await service.restoreFifo(item.variant_id, item.quantity)
    }
  },
)

const createOrderFromSaleStep = createStep(
  "create-order-from-external-sale",
  async (
    input: {
      sales_channel_id: string
      email: string
      currency_code?: string
      region_id?: string
      customer_username?: string
      itemsMeta: {
        variant_id: string
        quantity: number
        unit_price: number
        title: string
        sku: string | null
        snapshot: number
      }[]
    },
    { container },
  ): Promise<StepResponse<{ orderId: string }>> => {
    const { result: order } = await createOrderWorkflow(container).run({
      input: {
        sales_channel_id: input.sales_channel_id,
        email: input.email,
        currency_code: input.currency_code ?? "eur",
        ...(input.region_id ? { region_id: input.region_id } : {}),
        status: "completed",
        items: input.itemsMeta.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          title: item.title,
          ...(item.sku ? { sku: item.sku } : {}),
        })),
        metadata: {
          dcc_sales_channel: input.sales_channel_id,
          dcc_cost_snapshots: input.itemsMeta.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_cost_snapshot: item.snapshot,
          })),
          ...(input.customer_username
            ? { dcc_customer_username: input.customer_username }
            : {}),
        },
      },
    })

    return new StepResponse({ orderId: order.id })
  },
)

const adjustInventoryForSaleStep = createStep(
  "adjust-inventory-for-sale",
  async (
    input: { items: { variant_id: string; quantity: number }[] },
    { container },
  ) => {
    const inventoryService = container.resolve(ModuleRegistrationName.INVENTORY)
    const { inventoryByVariant, locationId } =
      await resolveInventoryForVariants(container, input.items.map((i) => i.variant_id))

    if (!locationId) {
      throw new Error("No stock location configured for inventory adjustments")
    }

    const applied: Array<{ inventoryItemId: string; quantity: number }> = []
    for (const item of input.items) {
      const inventoryItemId = inventoryByVariant.get(item.variant_id)
      if (!inventoryItemId) continue
      await inventoryService.adjustInventory(
        inventoryItemId,
        locationId,
        -item.quantity,
      )
      applied.push({ inventoryItemId, quantity: item.quantity })
    }

    return new StepResponse(applied, { applied, locationId })
  },
  async (input, { container }) => {
    if (!input?.applied?.length || !input.locationId) return
    const inventoryService = container.resolve(ModuleRegistrationName.INVENTORY)
    for (const adj of input.applied) {
      await inventoryService.adjustInventory(
        adj.inventoryItemId,
        input.locationId,
        adj.quantity,
      )
    }
  },
)

export const recordExternalSaleWorkflow = createWorkflow(
  "record-external-sale",
  (input: RecordExternalSaleWorkflowInput) => {
    const variantIds = transform(input, (i) => i.items.map((x) => x.variant_id))
    const details = fetchVariantDetailsStep({ variantIds })
    const allocated = allocateFifoSaleStep({ items: input.items })

    const itemsMeta = transform(
      { items: input.items, allocated, details },
      ({ items, allocated, details }) => {
        const byId = new Map(details.map((d) => [d.id, d]))
        return items.map((item) => {
          const alloc = allocated.find((a) => a.variant_id === item.variant_id)
          const variant = byId.get(item.variant_id)
          return {
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            title: variant?.title ?? "Prodotto",
            sku: variant?.sku ?? null,
            snapshot: alloc?.snapshot ?? 0,
          }
        })
      },
    )

    const order = createOrderFromSaleStep({
      sales_channel_id: input.sales_channel_id,
      email: input.email,
      currency_code: input.currency_code,
      region_id: input.region_id,
      customer_username: input.customer_username,
      itemsMeta,
    })
    adjustInventoryForSaleStep({ items: input.items })
    recomputeVariantCostStep({ variantIds })

    return new WorkflowResponse({ orderId: order.orderId })
  },
)

export default recordExternalSaleWorkflow