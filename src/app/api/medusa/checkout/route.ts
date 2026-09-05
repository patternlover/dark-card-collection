import { NextRequest, NextResponse } from "next/server"
import { medusaFetch } from "@/lib/medusa/client"
import {
  computeTotals,
  pickPaymentSession,
  selectShippingOption,
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

interface RegionWithProviders {
  id: string
  payment_providers?: Array<{ id: string }>
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
 * Opzioni di spedizione configurate in Medusa Admin (location → fulfillment set →
 * service zone → shipping options). Lo storefront le mostra e lascia scegliere.
 */
export async function GET(req: NextRequest) {
  const cartId = new URL(req.url).searchParams.get("cart_id")
  if (!cartId) {
    return NextResponse.json({ error: "Cart non specificato" }, { status: 400 })
  }
  try {
    const [cartData, shipData] = await Promise.all([
      medusaFetch<{ cart: { id: string; subtotal?: number } }>(`/carts/${cartId}`),
      medusaFetch<ShippingMethodsResponse>(`/shipping-options?cart_id=${cartId}`),
    ])
    const subtotal = Number(cartData.cart.subtotal ?? 0)
    const option = selectShippingOption(shipData.shipping_options, subtotal)
    return NextResponse.json({
      shipping_options: shipData.shipping_options,
      shipping_option_id: option?.id ?? null,
      totals: computeTotals(subtotal, option),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore spedizioni" },
      { status: 500 },
    )
  }
}
/**
 * Costruisce il checkout Medusa per il carrello corrente:
 *  - salva email + indirizzo di spedizione/fatturazione sul carrello;
 *  - applica la spedizione scelta (o automatica: gratuita sopra soglia);
 *  - riusa (o crea) la payment collection;
 *  - crea la payment session:
 *      provider "stripe" → restituisce il `client_secret` per il Payment Element;
 *      provider "system" (bonifico) → completa il carrello e restituisce l'ordine.
 *  - `sync_only` → aggiorna solo cart/spedizione senza toccare le sessioni:
 *    da usare al submit, per non ruotare l'intent già montato nell'Element
 *    (ruotarlo causa `payment_intent_unexpected_state`).
 * La risposta include sempre opzioni spedizione + totali (per il selettore UI).
 */
export async function POST(req: NextRequest) {
  try {
    const {
      cart_id,
      provider,
      email,
      shipping_address,
      sync_only,
      shipping_option_id,
    } = (await req.json()) as {
      cart_id?: string
      provider?: "stripe" | "system"
      email?: string
      shipping_address?: CheckoutAddress
      sync_only?: boolean
      shipping_option_id?: string
    }
    if (!cart_id) {
      return NextResponse.json({ error: "Cart non specificato" }, { status: 400 })
    }

    const payProvider = provider ?? "stripe"

    // Chiamate indipendenti in parallelo (il cold start del backend è lento).
    const [cartData, regionsData, shipData] = await Promise.all([
      medusaFetch<{ cart: { id: string; region_id?: string; subtotal?: number } }>(
        `/carts/${cart_id}`,
      ),
      medusaFetch<{ regions?: RegionWithProviders[] }>(
        `/regions?fields=id,payment_providers.id&limit=20`,
      ),
      medusaFetch<ShippingMethodsResponse>(`/shipping-options?cart_id=${cart_id}`),
    ])
    const cart = cartData.cart
    const region = regionsData.regions?.find((r) => r.id === cart.region_id)
    const ids = (region?.payment_providers ?? []).map((p) => p.id)
    const providerId =
      ids.find((id) => id === "pp_stripe_stripe") ??
      ids.find((id) => id.includes("_stripe")) ??
      ids.find((id) => id === "pp_system_default") ??
      ids[0] ??
      "pp_stripe_stripe"

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

    const subtotal = Number(cart.subtotal ?? 0)
    const option = selectShippingOption(
      shipData.shipping_options,
      subtotal,
      shipping_option_id,
    )

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

    const totals = computeTotals(subtotal, option)
    const shippingPayload = {
      shipping_options: shipData.shipping_options,
      shipping_option_id: option.id,
      totals,
    }

    if (sync_only) {
      return NextResponse.json({ ok: true, ...shippingPayload })
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

    return NextResponse.json({ client_secret: clientSecret, cart_id, ...shippingPayload })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore checkout" },
      { status: 500 },
    )
  }
}
