import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { sendOrderConfirmationEmail } from "../lib/order-email"

/**
 * Invia l'email di conferma ordine (Resend) su `order.placed`.
 * Se RESEND_API_KEY non è configurata, logga e non invia (l'ordine resta salvato).
 */
export default async function handleOrderPlacedEmail({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event.data.id
  const orderModuleService = container.resolve(ModuleRegistrationName.ORDER)

  const order = (await orderModuleService.retrieveOrder(orderId, {
    relations: ["items"],
  })) as {
    email?: string
    display_id?: number
    total?: number
    items?: Array<{ title?: string; quantity?: number; unit_price?: number }>
  }

  if (!order.email) return

  await sendOrderConfirmationEmail({
    orderId: String(order.display_id ?? orderId),
    customerEmail: order.email,
    items: (order.items ?? []).map((item) => ({
      title: item.title ?? "Prodotto",
      quantity: Number(item.quantity ?? 0),
      price: Number(item.unit_price ?? 0) / 100,
    })),
    total: Number(order.total ?? 0) / 100,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}