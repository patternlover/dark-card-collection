import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { sendOrderConfirmationEmail } from '@/lib/order-email'
import { recordSale } from '@/lib/record-sale'
import { logAudit } from '@/lib/audit'

function isDuplicateKeyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('duplicate key') || msg.includes('23505') || msg.includes('unique constraint')
}

export async function POST(req: Request) {
  const stripe = getStripe()
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

      if (session.currency !== 'eur') {
        console.log('Ignored non-EUR session:', session.id)
        break
      }

      if (session.payment_status !== 'paid') {
        console.log('Ignored unpaid session:', session.id)
        break
      }

      if (!session.amount_total || session.amount_total <= 0) {
        console.log('Ignored session without amount:', session.id)
        break
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

      const items = (
        await Promise.all(
          lineItems.data.map(async (item) => {
            const stripeProductId = item.price?.product
            let payloadProductId: number | null = null

            if (typeof stripeProductId === 'string') {
              const stripeProduct = await stripe.products.retrieve(stripeProductId)
              const pid = stripeProduct.metadata?.payloadProductId

              if (pid) {
                const products = await payload.find({ overrideAccess: true, 
                  collection: 'products',
                  where: { id: { equals: pid } },
                  limit: 1,
                })
                if (products.docs.length > 0) {
                  payloadProductId = products.docs[0]!.id as number
                }
              }
            }

            if (!payloadProductId) return null

            return {
              productId: payloadProductId,
              quantity: item.quantity || 1,
              price: (item.amount_total || 0) / 100,
            }
          })
        )
      ).filter((item): item is { productId: number; quantity: number; price: number } => item !== null)

      let result

      try {
        result = await recordSale(payload, {
          transactionId: session.id,
          channel: 'website',
          email: session.customer_details?.email || '',
          items,
          value: (session.amount_total || 0) / 100,
          currency: 'EUR',
          shipping: (session.shipping_cost?.amount_total || 0) / 100,
          stripeSessionId: session.id,
        })
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          console.log('Order already exists for session:', session.id)
          break
        }
        throw err
      }

      console.log('Order created for session:', session.id)
      logAudit('webhook.checkout.completed', { sessionId: session.id, value: (session.amount_total || 0) / 100 })

      const customerEmail = session.customer_details?.email
      if (customerEmail && result) {
        try {
          await sendOrderConfirmationEmail(payload, {
            orderId: session.id,
            customerEmail,
            total: (session.amount_total || 0) / 100,
            items: result.items.map((item) => ({
              title: item.productTitle,
              quantity: item.quantity,
              price: item.price,
            })),
          })
          console.log('Order confirmation email sent for session:', session.id)
        } catch (err) {
          console.error('Failed to send order confirmation email:', err)
        }
      }

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
