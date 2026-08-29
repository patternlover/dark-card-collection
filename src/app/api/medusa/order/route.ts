import { NextRequest, NextResponse } from "next/server"
import { medusaFetch } from "@/lib/medusa/client"

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

/** Legge un ordine dalla store API Medusa (per la pagina di conferma). */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get("order_id")
  if (!orderId) {
    return NextResponse.json({ error: "order_id mancante" }, { status: 400 })
  }
  try {
    const order = await medusaFetch<MedusaOrder>(`/orders/${orderId}`)
    return NextResponse.json({
      order: {
        transactionId: String(order.display_id ?? order.id ?? orderId),
        value: Number(order.total ?? 0) / 100,
        email: order.email ?? "",
        items: (order.items ?? []).map((item) => ({
          product: { title: item.title ?? "Prodotto" },
          quantity: item.quantity ?? 0,
          price: Number(item.unit_price ?? 0) / 100,
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