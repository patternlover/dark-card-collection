import { NextRequest, NextResponse } from "next/server"
import { medusaFetch } from "@/lib/medusa/client"
import {
  pickPaymentSession,
  toOrderSummary,
  type CheckoutAddress,
} from "@/lib/checkout"

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
    payment_sessions?: Array<{
      id?: string
      provider_id?: string
      data?: { client_secret?: string }
    }>
  }
}

interface CompleteResponse {
  type?: string
  order?: {
    id?: string
    display_id?: number
    email?: string
    total?: number
    items?: Array<{ title?: string; quantity?: number; unit_price?: number }>
  }
}

interface CartWithCollection {
  cart: {
    id: string
    region_id?: string
    subtotal?: number
    payment_collection?: { id: string } | null
  }
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
 * Riusa la payment collection già legata al carrello, se presente; altrimenti ne
 * crea una nuova. Evita pile-up di collection/intent a ogni apertura del checkout.
 */
async function ensurePaymentCollection(cartId: string): Promise<string> {
  try {
    const existing = await medusaFetch<CartWithCollection>(
      `/carts/${cartId}?fields=id,payment_collection.id`,
    )
    const id = existing.cart?.payment_collection?.id
    if (id) return id
  } catch {
    // fields non supportato o cart senza collection: si crea sotto
  }
  const { payment_collection } = await medusaFetch<PaymentCollectionResponse>(
    `/payment-collections`,
    { method: "POST", body: { cart_id: cartId } },
  )
  return payment_collection.id
}

/**
 * Costruisce il checkout Medusa per il carrello corrente:
 *  - salva email + indirizzo di spedizione/fatturazione sul carrello;
 *  - calcola la spedizione (Standard €9,99 | Gratuita dagli 80€) e la applica;
 *  - riusa (o crea) la payment collection;
 *  - crea la payment session:
 *      provider "stripe" → restituisce il `client_secret` per il Payment Element;
 *      provider "system" (bonifico) → completa il carrello e restituisce l'ordine.
 *  - `sync_only` → aggiorna solo cart/spedizione senza toccare le sessioni:
 *    da usare al submit, per non ruotare l'intent già montato nell'Element
 *    (ruotarlo causa `payment_intent_unexpected_state`).
 */
export async function POST(req: NextRequest) {
  try {
    const { cart_id, provider, email, shipping_address, sync_only } =
      (await req.json()) as {
        cart_id?: string
        provider?: "stripe" | "system"
        email?: string
        shipping_address?: CheckoutAddress
        sync_only?: boolean
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

    // Email + indirizzi per l'ordine (conferma email + complete Medusa).
    const cartUpdate: Record<string, unknown> = {}
    if (email) cartUpdate.email = email
    if (shipping_address) {
      cartUpdate.shipping_address = shipping_address
      cartUpdate.billing_address = shipping_address
    }
    if (Object.keys(cartUpdate).length > 0) {
      await medusaFetch(`/carts/${cart_id}`, { method: "POST", body: cartUpdate })
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

    if (sync_only) {
      return NextResponse.json({ ok: true })
    }

    const paymentCollectionId = await ensurePaymentCollection(cart_id)

    if (payProvider === "system") {
      await medusaFetch<PaymentSessionResponse>(
        `/payment-collections/${paymentCollectionId}/payment-sessions`,
        { method: "POST", body: { provider_id: "pp_system_default" } },
      )
      const completed = await medusaFetch<CompleteResponse>(`/carts/${cart_id}/complete`, {
        method: "POST",
      })
      if (completed.type === "order" && completed.order) {
        const summary = toOrderSummary(completed.order, "")
        if (!summary) {
          return NextResponse.json({ error: "Checkout non completato" }, { status: 400 })
        }
        return NextResponse.json({ order_id: summary.orderId, order: summary })
      }
      return NextResponse.json({ error: "Checkout non completato" }, { status: 400 })
    }

    const sessionData = await medusaFetch<PaymentSessionResponse>(
      `/payment-collections/${paymentCollectionId}/payment-sessions`,
      { method: "POST", body: { provider_id: providerId } },
    )
    const session = pickPaymentSession(
      sessionData.payment_collection?.payment_sessions,
      providerId,
    )
    const clientSecret = session?.data?.client_secret
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
