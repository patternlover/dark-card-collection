import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const payload = await getPayloadClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object

      const existingOrders = await payload.find({
        collection: 'orders',
        where: { stripeSessionId: { equals: session.id } },
        limit: 1,
      })

      if (existingOrders.docs.length > 0) {
        console.log('Order already exists for session:', session.id)
        break
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

      const orderItems = await Promise.all(
        lineItems.data.map(async (item) => {
          const stripeProductId = item.price?.product
          let payloadProductId: number | null = null

          if (typeof stripeProductId === 'string') {
            const stripeProduct = await stripe.products.retrieve(stripeProductId)
            const pid = stripeProduct.metadata?.payloadProductId

            if (pid) {
              const products = await payload.find({
                collection: 'products',
                where: { id: { equals: pid } },
                limit: 1,
              })
              if (products.docs.length > 0) {
                payloadProductId = products.docs[0]!.id as number
              }
            }
          }

          return {
            product: payloadProductId || 0,
            quantity: item.quantity || 1,
            price: (item.amount_total || 0) / 100,
          }
        })
      )

      await payload.create({
        collection: 'orders',
        data: {
          orderId: session.id,
          status: 'paid',
          items: orderItems as any,
          total: (session.amount_total || 0) / 100,
          stripeSessionId: session.id,
          email: session.customer_details?.email || '',
        },
      })

      console.log('Order created for session:', session.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object
      console.log('Payment failed:', paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
