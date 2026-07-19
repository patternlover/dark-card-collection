import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const FREE_SHIPPING_THRESHOLD = 100
const SHIPPING_COST = 9.99

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, shipping } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nessun prodotto nel carrello' },
        { status: 400 }
      )
    }

    const lineItems = items.map((item: { title: string; price: number; quantity: number; id: number | string; image?: string | null; imageUrl?: string | null; images?: string[] | null }) => {
      const productImages = item.imageUrl
        ? [item.imageUrl]
        : item.images && item.images.length > 0
          ? item.images.filter(Boolean)
          : item.image
            ? [item.image]
            : []

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            ...(productImages.length > 0 ? { images: productImages.slice(0, 8) } : {}),
            metadata: {
              payloadProductId: String(item.id),
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }
    })

    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Spedizione',
          },
          unit_amount: Math.round(SHIPPING_COST * 100),
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['IT'],
      },
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
      metadata: {
        productIds: items.map((item: { id: number | string }) => String(item.id)).join(','),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della sessione di pagamento' },
      { status: 500 }
    )
  }
}
