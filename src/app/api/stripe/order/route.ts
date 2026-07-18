import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id mancante' },
      { status: 400 }
    )
  }

  const payload = await getPayloadClient()

  const orders = await payload.find({
    collection: 'orders',
    where: { stripeSessionId: { equals: sessionId } },
    limit: 1,
    populate: ['items.product'],
  })

  if (orders.docs.length === 0) {
    return NextResponse.json(
      { error: 'Ordine non trovato' },
      { status: 404 }
    )
  }

  const order = orders.docs[0]

  return NextResponse.json({
    order: {
      orderId: order.orderId,
      total: order.total,
      email: order.email,
      status: order.status,
      items: order.items,
    },
  })
}
