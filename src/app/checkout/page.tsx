'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '@/hooks/useCart'
import { trackBeginCheckout } from '@/lib/analytics'
import { LoadingFallback } from '@/components/ui/LoadingFallback'
import { Reveal } from '@/components/ui/Reveal'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
)

function getAccentColor() {
  if (typeof window === 'undefined') return '#FACC15'
  const val = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  return val || '#FACC15'
}

export default function CheckoutPage() {
  const { items, shipping, total } = useCart()
  const [loading, setLoading] = useState<boolean>(() => (items.length === 0 ? false : true))
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    let cancelled = false

    async function initCheckout() {
      try {
        if (items.length === 0) {
          setLoading(false)
          return
        }

        trackBeginCheckout(
          items.map((item) => ({
            item_id: String(item.id),
            item_name: item.title,
            price: item.price,
            currency: 'EUR',
            quantity: item.quantity,
          })),
          total,
        )

        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
            shipping,
          }),
        })

        const data = await res.json()
        if (!data.client_secret) {
          throw new Error(data.error || 'Errore nel checkout')
        }

        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          throw new Error('Configurazione Stripe mancante')
        }

        const stripe = await stripePromise
        if (!stripe) throw new Error('Impossibile caricare Stripe')

        const checkout = await stripe.createEmbeddedCheckoutPage({
          clientSecret: data.client_secret,
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: getAccentColor(),
              colorBackground: '#0a0a0a',
              colorText: '#fafafa',
              colorTextSecondary: '#a1a1aa',
              borderRadius: '8px',
            },
          },
        } as Parameters<typeof stripe.createEmbeddedCheckoutPage>[0] & {
          appearance: { theme: 'night'; variables: Record<string, string> }
        })

        if (cancelled) return
        const el = document.getElementById('embedded-checkout')
        if (el) checkout.mount(el)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Errore nel checkout')
        setLoading(false)
      }
    }

    initCheckout()
    return () => {
      cancelled = true
    }
  }, [items, shipping, total])

  if (items.length === 0 && !loading) {
    return (
      <div className="bg-black">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-zinc-500">Il carrello è vuoto.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Torna allo shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Reveal>
          <h1 className="mb-8 text-3xl font-bold text-white">Checkout</h1>
        </Reveal>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
            {error}{' '}
            <Link href="/cart" className="underline underline-offset-2 hover:text-red-300">
              Torna al carrello
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-2">
            <div className="border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a]">
              <h2 className="mb-4 text-lg font-black uppercase tracking-wide text-white">
                Riepilogo ordine
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border-2 border-transparent p-2 text-sm transition-colors hover:border-[var(--accent)] hover:bg-zinc-800/50"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded border border-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded border border-zinc-800 bg-zinc-800" />
                    )}
                    <div className="flex flex-1 justify-between gap-2">
                      <span className="text-zinc-300 transition-colors hover:text-[var(--accent)]">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-white">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-zinc-800 pt-3 flex justify-between text-sm">
                  <span className="text-zinc-400">Spedizione</span>
                  <span className="text-white">
                    {shipping === 0 ? 'Gratuita' : `€${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-zinc-800 pt-3 flex justify-between text-base font-bold">
                  <span className="text-white">Totale</span>
                  <span className="text-[var(--accent)]">€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-zinc-600">
              <Lock className="h-3 w-3" />
              Pagamento sicuro elaborato da Stripe
            </p>
          </div>

          <div className="relative lg:col-span-3">
            <div id="embedded-checkout" />
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <LoadingFallback label="Preparazione del pagamento..." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
