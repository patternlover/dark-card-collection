import { NextRequest, NextResponse } from "next/server"
import { medusaFetch } from "@/lib/medusa/client"
import { isRetryableCompleteError, toOrderSummary } from "@/lib/checkout"

interface MedusaOrderItem {
  title?: string
  quantity?: number
  unit_price?: number
}

interface MedusaOrder {
  id?: string
  display_id?: number
  email?: string
  total?: number
  items?: MedusaOrderItem[]
}

interface CompleteResponse {
  type?: string
  order?: MedusaOrder
}

/** Legge un ordine dalla store API Medusa (per la pagina di conferma). */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get("order_id")
  if (!orderId) {
    return NextResponse.json({ error: "order_id mancante" }, { status: 400 })
  }
  // I clienti loggati passano il Bearer token (i guest usano lo snapshot locale).
  const auth = req.headers.get("authorization") ?? undefined
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : undefined
  try {
    const order = await medusaFetch<MedusaOrder>(`/orders/${orderId}`, { token })
    const summary = toOrderSummary(order, orderId)
    if (!summary) {
      return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 })
    }
    return NextResponse.json({
      order: {
        transactionId: summary.transactionId,
        value: summary.value,
        email: summary.email,
        items: summary.items.map((item) => ({
          product: { title: item.title },
          quantity: item.quantity,
          price: item.price,
        })),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ordine non trovato" },
      { status: 404 },
    )
  }
}

/**
 * Tenta una singola `complete` del carrello (path Stripe, dopo `confirmPayment`).
 * La sessione viene autorizzata dal webhook in modo asincrono: se risponde con un
 * errore ritentabile il client riprova (`retryable: true`).
 */
export async function POST(req: NextRequest) {
  try {
    const { cart_id } = (await req.json()) as { cart_id?: string }
    if (!cart_id) {
      return NextResponse.json({ error: "Cart non specificato" }, { status: 400 })
    }
    const completed = await medusaFetch<CompleteResponse>(`/carts/${cart_id}/complete`, {
      method: "POST",
    })
    if (completed.type === "order" && completed.order) {
      const summary = toOrderSummary(completed.order, "")
      if (!summary) {
        return NextResponse.json({ error: "Ordine non creato" }, { status: 400 })
      }
      return NextResponse.json({ order_id: summary.orderId, order: summary })
    }
    return NextResponse.json(
      { error: "Ordine non ancora confermato", retryable: true },
      { status: 400 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore conferma ordine"
    const status = isRetryableCompleteError(message) ? 409 : 400
    return NextResponse.json(
      { error: message, retryable: isRetryableCompleteError(message) },
      { status },
    )
  }
}
