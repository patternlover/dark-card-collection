import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export interface ResolvedInventory {
  /** variant_id → inventory_item_id (only for variants with an inventory item). */
  inventoryByVariant: Map<string, string>
  /** The first stock location id (the single "Magazzino IT" location). */
  locationId: string | undefined
}

interface QueryGraphInput {
  entity: string
  fields?: string[]
  filters?: Record<string, unknown>
}

/**
 * Resolves the inventory item ids for the given product variants (via the
 * product_variant ↔ inventory_item link) and the default stock location.
 * Plain async helper — call it from workflow steps (a step cannot invoke
 * another step).
 */
export async function resolveInventoryForVariants(
  container: MedusaContainer,
  variantIds: string[],
): Promise<ResolvedInventory> {
  const query = container.resolve(
    ContainerRegistrationKeys.QUERY,
  ) as unknown as {
    graph: (input: QueryGraphInput) => Promise<{ data: any[] }>
  }

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: variantIds },
  })

  const inventoryByVariant = new Map<string, string>()
  for (const variant of variants as Array<{
    id: string
    inventory_items?: Array<{ inventory_item_id?: string }>
  }>) {
    const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    if (inventoryItemId) {
      inventoryByVariant.set(variant.id, inventoryItemId)
    }
  }

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const locationId = (locations as Array<{ id: string }>)[0]?.id

  return { inventoryByVariant, locationId }
}