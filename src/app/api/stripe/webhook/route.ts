import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import config from '@payload-config'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Payment successful:', session.id)

      try {
        const payload = await getPayload({ config })

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

        const items = lineItems.data.map((item) => ({
          product: item.id,
          quantity: item.quantity || 1,
          price: (item.amount_total || 0) / 100,
        }))

        await payload.create({
          collection: 'orders',
          data: {
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent as string,
            total: (session.amount_total || 0) / 100,
            status: 'paid',
            items,
            shippingAddress: {
              name: session.customer_details?.name || '',
              address: session.customer_details?.address?.line1 || '',
              city: session.customer_details?.address?.city || '',
              postalCode: session.customer_details?.address?.postal_code || '',
              country: session.customer_details?.address?.country || '',
            },
          },
        })

        console.log('Order created for session:', session.id)
      } catch (err) {
        console.error('Error creating order:', err)
      }

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
