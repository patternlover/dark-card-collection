/**
 * Helpers cart Medusa (store API) — usati dal CartProvider e dal checkout.
 * Gli importi Medusa sono in centesimi (minor unit).
 */
import { medusaFetch } from "./client"

export interface MedusaLineItem {
  id: string
  title: string
  thumbnail?: string | null
  unit_price?: number
  quantity?: number
  variant_id?: string
}

export interface MedusaCart {
  id: string
  region_id?: string
  currency_code?: string
  items?: MedusaLineItem[]
  subtotal?: number
  shipping_total?: number
  total?: number
  completed_at?: string | null
  order_id?: string | null
}

export interface MedusaRegion {
  id: string
  name: string
  currency_code?: string
}

export async function getMedusaRegionId(): Promise<string> {
  const data = await medusaFetch<{ regions?: MedusaRegion[] }>(`/regions?limit=10`)
  const region = data.regions?.find((r) => r.currency_code === "eur") ?? data.regions?.[0]
  if (!region) throw new Error("Nessuna region EUR configurata in Medusa")
  return region.id
}

export async function createMedusaCart(regionId: string): Promise<MedusaCart> {
  return medusaFetch<MedusaCart>(`/carts`, {
    method: "POST",
    body: { region_id: regionId, currency_code: "eur" },
  })
}

export async function getMedusaCart(cartId: string): Promise<MedusaCart> {
  return medusaFetch<MedusaCart>(`/carts/${cartId}`)
}

export async function addMedusaLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<MedusaCart> {
  return medusaFetch<MedusaCart>(`/carts/${cartId}/line-items`, {
    method: "POST",
    body: { variant_id: variantId, quantity },
  })
}

export async function updateMedusaLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
): Promise<MedusaCart> {
  return medusaFetch<MedusaCart>(`/carts/${cartId}/line-items/${lineItemId}`, {
    method: "POST",
    body: { quantity },
  })
}

export async function removeMedusaLineItem(
  cartId: string,
  lineItemId: string,
): Promise<MedusaCart> {
  return medusaFetch<MedusaCart>(`/carts/${cartId}/line-items/${lineItemId}`, {
    method: "DELETE",
  })
}