'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { trackPurchase } from '@/lib/analytics'
import { proxyImageUrl } from '@/lib/proxy-image'

interface OrderItem {
  product: { title: string; imageUrl?: string | null; images?: Array<{ image?: { url: string } | null }>; image?: { url: string } | null } | null
  quantity: number
  price: number
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()
  const [order, setOrder] = useState<{
    orderId: string
    total: number
    email: string
    items: OrderItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clearCart()

    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/stripe/order?session_id=${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) {
          setOrder(data.order)
          trackPurchase(
            data.order.orderId,
            data.order.items.map((item: OrderItem) => ({
              item_id: item.product?.title || '',
              item_name: item.product?.title || '',
              price: item.price,
              currency: 'EUR',
              quantity: item.quantity,
            })),
            data.order.total,
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId, clearCart])

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        {loading ? (
          <Loader2 className="h-16 w-16 text-zinc-500 mx-auto mb-6 animate-spin" />
        ) : (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        )}

        <h1 className="text-3xl font-bold text-white mb-4">
          {loading ? 'Verifica ordine...' : 'Ordine confermato!'}
        </h1>

        <p className="text-zinc-400 mb-8">
          {order
            ? `Grazie per il tuo ordine. Conferma inviata a ${order.email}.`
            : 'Riceverai una email di conferma a breve.'}
        </p>

        {order && (
          <div className="rounded-lg border border-zinc-800 p-6 mb-8 text-left">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">
              Dettagli ordine
            </h2>
            <p className="text-xs text-zinc-600 mb-4">
              Ordine #{order.orderId.slice(-8).toUpperCase()}
            </p>
            <div className="space-y-2 text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {proxyImageUrl(item.product?.imageUrl || item.product?.images?.[0]?.image?.url || item.product?.image?.url) ? (
                    <img src={proxyImageUrl(item.product?.imageUrl || item.product?.images?.[0]?.image?.url || item.product?.image?.url)!} alt={item.product?.title || ''} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-zinc-800" />
                  )}
                  <div className="flex-1 flex justify-between">
                    <span className="text-zinc-400">
                      {item.product?.title || 'Prodotto'} x{item.quantity}
                    </span>
                    <span className="text-white">€{item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-zinc-800 pt-2 flex justify-between font-medium">
                <span className="text-white">Totale</span>
                <span className="text-white">€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-zinc-800 p-6 mb-8 text-left">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">
            Prossimi passi
          </h2>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li>• Riceverai una email con i dettagli dell&apos;ordine</li>
            <li>• Il tuo ordine verrà elaborato entro 24 ore</li>
            <li>• Riceverai il codice di tracciamento appena spedito</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Continua lo shopping
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-white hover:border-zinc-500"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-black">
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <Loader2 className="h-16 w-16 text-zinc-500 mx-auto mb-6 animate-spin" />
            <h1 className="text-3xl font-bold text-white mb-4">Caricamento...</h1>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
