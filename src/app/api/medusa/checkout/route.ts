import { NextRequest, NextResponse } from "next/server"
import { medusaFetch } from "@/lib/medusa/client"

interface ShippingOption {
  id: string
  name?: string
  amount?: number
}

interface ShippingMethodsResponse {
  shipping_options: ShippingOption[]
}

interface PaymentCollectionResponse {
  payment_collection: { id: string }
}

interface PaymentSessionResponse {
  payment_collection?: {
    payment_sessions?: Array<{ data?: { client_secret?: string }; id?: string }>
  }
}

interface CompleteResponse {
  type?: string
  order?: { id: string }
}

const FREE_SHIPPING_THRESHOLD_CENTS = 80_00

interface RegionWithProviders {
  id: string
  payment_providers?: Array<{ id: string }>
}

/**
 * Risolve il provider di pagamento attivo della region. Lo store API espone i
 * payment_providers via fields. Il provider carte Stripe è `pp_stripe_stripe`.
 */
async function resolvePaymentProviderId(regionId: string): Promise<string> {
  const data = await medusaFetch<{ regions?: RegionWithProviders[] }>(
    `/regions?fields=id,payment_providers.id&limit=20`,
  )
  const region = data.regions?.find((r) => r.id === regionId)
  const ids = (region?.payment_providers ?? []).map((p) => p.id)
  return (
    ids.find((id) => id === "pp_stripe_stripe") ??
    ids.find((id) => id.includes("_stripe")) ??
    ids.find((id) => id === "pp_system_default") ??
    ids[0] ??
    "pp_stripe_stripe"
  )
}

/**
 * Costruisce il checkout Medusa per il carrello corrente:
 *  - calcola la spedizione (Standard €9,99 | Gratuita dagli 80€) e la applica;
 *  - crea la payment collection;
 *  - crea la payment session:
 *      provider "stripe" → restituisce il `client_secret` per il Payment Element;
 *      provider "system" → completa il carrello e restituisce `order_id` (test/dev).
 */
export async function POST(req: NextRequest) {
  try {
    const { cart_id, provider, email } = (await req.json()) as {
      cart_id?: string
      provider?: "stripe" | "system"
      email?: string
    }
    if (!cart_id) {
      return NextResponse.json({ error: "Cart non specificato" }, { status: 400 })
    }

    const payProvider = provider ?? "stripe"

    const cartData = await medusaFetch<{
      cart: { id: string; region_id?: string; subtotal?: number }
    }>(`/carts/${cart_id}`)
    const cart = cartData.cart
    const providerId = await resolvePaymentProviderId(cart.region_id ?? "")

    // Email per l'ordine (conferma + link cliente).
    if (email) {
      await medusaFetch(`/carts/${cart_id}`, { method: "POST", body: { email } })
    }

    const { shipping_options } = await medusaFetch<ShippingMethodsResponse>(
      `/shipping-options?cart_id=${cart_id}`,
    )

    const subtotal = Number(cart.subtotal ?? 0)
    const free = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
    const option =
      (free
        ? shipping_options.find((o) => (o.amount ?? 0) === 0)
        : shipping_options.find((o) => (o.amount ?? 0) > 0)) ??
      shipping_options[0]

    if (!option) {
      return NextResponse.json(
        { error: "Nessuna opzione di spedizione disponibile" },
        { status: 400 },
      )
    }

    await medusaFetch(`/carts/${cart_id}/shipping-methods`, {
      method: "POST",
      body: { option_id: option.id },
    })

    const { payment_collection } = await medusaFetch<PaymentCollectionResponse>(
      `/payment-collections`,
      { method: "POST", body: { cart_id } },
    )

    if (payProvider === "system") {
      await medusaFetch<PaymentSessionResponse>(
        `/payment-collections/${payment_collection.id}/payment-sessions`,
        { method: "POST", body: { provider_id: "pp_system_default" } },
      )
      const completed = await medusaFetch<CompleteResponse>(`/carts/${cart_id}/complete`, {
        method: "POST",
      })
      if (completed.type === "order" && completed.order) {
        return NextResponse.json({ order_id: completed.order.id })
      }
      return NextResponse.json({ error: "Checkout non completato" }, { status: 400 })
    }

    const sessionData = await medusaFetch<PaymentSessionResponse>(
      `/payment-collections/${payment_collection.id}/payment-sessions`,
      { method: "POST", body: { provider_id: providerId } },
    )
    const clientSecret = sessionData.payment_collection?.payment_sessions?.[0]?.data
      ?.client_secret
    if (!clientSecret) {
      return NextResponse.json(
        { error: "Sessione di pagamento Stripe non disponibile" },
        { status: 400 },
      )
    }

    return NextResponse.json({ client_secret: clientSecret, cart_id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore checkout" },
      { status: 500 },
    )
  }
}