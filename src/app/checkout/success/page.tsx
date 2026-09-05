'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { trackPurchase } from '@/lib/analytics'
import { loadOrderSnapshot, type OrderSummary } from '@/lib/checkout'
import { proxyImageUrl } from '@/lib/proxy-image'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

interface OrderItem {
  product: { title: string; images?: Array<{ image?: { url: string } | null }>; image?: { url: string } | null } | null
  quantity: number
  price: number
}

const TRACKED_KEY = 'dcc-purchase-tracked'

function trackSnapshotPurchase(snapshot: OrderSummary, orderId: string) {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(TRACKED_KEY) === orderId) return
  sessionStorage.setItem(TRACKED_KEY, orderId)
  trackPurchase(
    snapshot.transactionId,
    snapshot.items.map((item) => ({
      item_id: item.title,
      item_name: item.title,
      price: item.price,
      currency: 'EUR',
      quantity: item.quantity,
    })),
    snapshot.value,
  )
}

function toDisplayOrder(order: OrderSummary) {
  return {
    transactionId: order.transactionId,
    value: order.value,
    email: order.email,
    items: order.items.map((item) => ({
      product: { title: item.title },
      quantity: item.quantity,
      price: item.price,
    })),
  }
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const { clearCart } = useCart()
  const { token } = useAuth()
  const clearedRef = useRef(false)
  const [order, setOrder] = useState<{
    transactionId: string
    value: number
    email: string
    items: OrderItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true
      clearCart()
    }

    if (!orderId) {
      setLoading(false)
      return
    }

    // I guest non possono rileggere l'ordine dalla store API senza token:
    // si usa prima lo snapshot salvato al checkout.
    const snapshot = loadOrderSnapshot(orderId)
    if (snapshot) {
      setOrder(toDisplayOrder(snapshot))
      trackSnapshotPurchase(snapshot, orderId)
      setLoading(false)
      return
    }

    fetch(`/api/medusa/order?order_id=${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) {
          setOrder(data.order)
          const alreadyTracked = typeof window !== 'undefined' && sessionStorage.getItem(TRACKED_KEY) === orderId
          if (!alreadyTracked) {
            sessionStorage.setItem(TRACKED_KEY, orderId)
            trackPurchase(
              data.order.transactionId,
              data.order.items.map((item: OrderItem) => ({
                item_id: item.product?.title || '',
                item_name: item.product?.title || '',
                price: item.price,
                currency: 'EUR',
                quantity: item.quantity,
              })),
              data.order.value,
            )
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId, clearCart, token])

  useEffect(() => {
    if (loading || !order) return
    const t = setTimeout(() => router.replace('/'), 3000)
    return () => clearTimeout(t)
  }, [loading, order, router])

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Breadcrumb
          className="mb-6 text-left"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Checkout', href: '/checkout' },
            { label: 'Ordine confermato' },
          ]}
        />

        {loading ? (
          <Loader2 className="h-16 w-16 text-zinc-500 mx-auto mb-6 animate-spin" />
        ) : (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        )}

        <Reveal>
          <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-white">
            {loading ? 'Verifica ordine...' : 'Ordine confermato!'}
          </h1>
        </Reveal>

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
              Ordine #{order.transactionId.slice(-8).toUpperCase()}
            </p>
            <div className="space-y-2 text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {proxyImageUrl(item.product?.images?.[0]?.image?.url || item.product?.image?.url) ? (
                    <img src={proxyImageUrl(item.product?.images?.[0]?.image?.url || item.product?.image?.url)!} alt={item.product?.title || ''} width={40} height={40} className="h-10 w-10 rounded object-cover" />
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
                <span className="text-white">€{order.value.toFixed(2)}</span>
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

        {order && (
          <p className="mt-6 text-xs text-zinc-600">
            Verrai reindirizzato alla home tra pochi secondi...
          </p>
        )}
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
            <Reveal>
              <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-white">Caricamento...</h1>
            </Reveal>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
