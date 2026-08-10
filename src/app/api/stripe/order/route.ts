import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
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

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Ordine non trovato' },
      { status: 404 }
    )
  }

  const payload = await getPayloadClient()

  const orders = await payload.find({
    collection: 'orders',
    where: { stripe_session_id: { equals: sessionId } },
    limit: 1,
    depth: 2,
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
      transactionId: order.transaction_id,
      value: order.value,
      email: order.email,
      status: order.status,
      items: order.items,
    },
  })
}
