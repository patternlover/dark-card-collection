import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { proxyImageUrl } from '@/lib/proxy-image'
import { getProductImageInfo } from '@/lib/product-image'
import { clientIp, isRateLimited } from '@/lib/rate-limit'

const FREE_SHIPPING_THRESHOLD = 80
const SHIPPING_COST = 9.99
const MAX_QUANTITY = 99
const MAX_ITEMS = 100

export async function POST(req: Request) {
  try {
    if (isRateLimited(`checkout:${clientIp(req)}`, 30, 60_000)) {
      return NextResponse.json(
        { error: 'Troppe richieste. Riprova tra poco.' },
        { status: 429 }
      )
    }
    const stripe = getStripe()
    const payload = await getPayloadClient()

    const body = await req.json()
    const rawItems = Array.isArray(body?.items) ? body.items : []

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: 'Nessun prodotto nel carrello' },
        { status: 400 }
      )
    }

    if (rawItems.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: 'Troppi prodotti nel carrello' },
        { status: 400 }
      )
    }

    const requested: Array<{ id: number; quantity: number }> = []
    for (const item of rawItems) {
      const id = Number(item?.id)
      const quantity = Number(item?.quantity)

      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
          { error: 'Prodotto non valido nel carrello' },
          { status: 400 }
        )
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        return NextResponse.json(
          { error: 'Quantità non valida nel carrello' },
          { status: 400 }
        )
      }
      requested.push({ id, quantity })
    }

    const ids = [...new Set(requested.map((r) => r.id))]

    const result = await payload.find({ overrideAccess: true, 
      collection: 'products',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 1,
    })

    const productById = new Map(result.docs.map((p) => [p.id, p]))

    const lineItems = []
    for (const { id, quantity } of requested) {
      const product = productById.get(id)

      if (!product) {
        return NextResponse.json(
          { error: 'Prodotto non trovato nel carrello' },
          { status: 400 }
        )
      }

      const anyProduct = product as any

      if (anyProduct.is_visible === false) {
        return NextResponse.json(
          { error: 'Prodotto non disponibile' },
          { status: 400 }
        )
      }

      if (anyProduct.status !== 'listed' && anyProduct.status !== 'hold') {
        return NextResponse.json(
          { error: 'Prodotto non disponibile' },
          { status: 400 }
        )
      }

      const unitPrice = Number(anyProduct.price)
      if (!unitPrice || unitPrice <= 0) {
        return NextResponse.json(
          { error: 'Prezzo non disponibile' },
          { status: 400 }
        )
      }

      const stock = anyProduct.quantity
      if (stock !== null && stock !== undefined && Number(stock) < quantity) {
        return NextResponse.json(
          { error: 'Quantità richiesta non disponibile' },
          { status: 400 }
        )
      }

      const imageUrl = proxyImageUrl(getProductImageInfo(anyProduct).cardUrl)

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: String(anyProduct.title || 'Prodotto'),
            ...(imageUrl ? { images: [imageUrl] } : {}),
            metadata: {
              payloadProductId: String(id),
            },
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      })
    }

    const subtotalCents = lineItems.reduce(
      (sum, li) => sum + li.price_data.unit_amount * li.quantity,
      0
    )
    const shippingCost =
      subtotalCents >= FREE_SHIPPING_THRESHOLD * 100 ? 0 : SHIPPING_COST

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Spedizione',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['IT'],
      },
      billing_address_collection: 'required',
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      branding_settings: {
        display_name: 'Dark Card Collection',
        background_color: '#0a0a0a',
        button_color: '#FACC15',
        border_style: 'rectangular',
        font_family: 'inter',
      },
      metadata: {
        productIds: requested.map((r) => String(r.id)).join(','),
      },
    })

    return NextResponse.json({ client_secret: session.client_secret })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della sessione di pagamento' },
      { status: 500 }
    )
  }
}
