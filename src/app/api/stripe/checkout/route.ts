import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nessun prodotto nel carrello' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: { title: string; price: number; quantity: number }) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
      metadata: {
        // Will be used to link to Payload order
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
