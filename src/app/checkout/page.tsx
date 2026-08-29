"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { loadStripe, Stripe, StripeElements } from "@stripe/stripe-js"
import { useCart } from "@/hooks/useCart"
import { trackBeginCheckout } from "@/lib/analytics"
import { medusaFetch } from "@/lib/medusa/client"
import { LoadingFallback } from "@/components/ui/LoadingFallback"
import { Reveal } from "@/components/ui/Reveal"
import { Breadcrumb } from "@/components/ui/Breadcrumb"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
)

async function pollForOrderId(cartId: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const cart = await medusaFetch<{ order_id?: string | null; completed_at?: string | null }>(
      `/carts/${cartId}`,
    )
    if (cart.order_id) return cart.order_id
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error("Ordine non ancora confermato")
}

export default function CheckoutPage() {
  const { items, cartId, shipping, total, loading } = useCart()
  const [state, setState] = useState<"init" | "ready" | "processing" | "error">("init")
  const [error, setError] = useState("")
  const stripeRef = useRef<Stripe | null>(null)
  const elementsRef = useRef<StripeElements | null>(null)

  useEffect(() => {
    if (loading) return
    if (items.length === 0) {
      setState("init")
      return
    }
    if (!cartId) {
      setError("Carrello non inizializzato")
      setState("error")
      return
    }

    let cancelled = false

    async function init() {
      try {
        trackBeginCheckout(
          items.map((item) => ({
            item_id: String(item.variantId ?? item.id),
            item_name: item.title,
            price: item.price,
            currency: "EUR",
            quantity: item.quantity,
          })),
          total,
        )

        const res = await fetch("/api/medusa/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartId }),
        })
        const data = await res.json()
        if (!data.client_secret) {
          throw new Error(data.error || "Errore nel checkout")
        }

        const stripe = await stripePromise
        if (!stripe) throw new Error("Impossibile caricare Stripe")
        const elements = stripe.elements({ clientSecret: data.client_secret })
        const paymentElement = elements.create("payment")
        paymentElement.mount("#payment-element")
        stripeRef.current = stripe
        elementsRef.current = elements
        if (cancelled) return
        setState("ready")
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Errore nel checkout")
        setState("error")
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [items, cartId, total, loading])

  async function handleSubmit() {
    const stripe = stripeRef.current
    const elements = elementsRef.current
    if (!stripe || !elements || !cartId) return
    setState("processing")
    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })
      if (confirmError) {
        setError(confirmError.message || "Errore di pagamento")
        setState("ready")
        return
      }
      const orderId = await pollForOrderId(cartId)
      window.location.href = `/checkout/success?order_id=${orderId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di pagamento")
      setState("ready")
    }
  }

  if (!loading && items.length === 0) {
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
        <Breadcrumb
          className="mb-4"
          items={[{ label: "Home", href: "/" }, { label: "Carrello", href: "/cart" }, { label: "Checkout" }]}
        />
        <Reveal>
          <h1 className="mb-8 text-3xl font-black uppercase tracking-tight text-white">Checkout</h1>
        </Reveal>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
            {error}{" "}
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
                    {shipping === 0 ? "Gratuita" : `€${shipping.toFixed(2)}`}
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

          <div className="lg:col-span-3">
            <div className="relative border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a]">
              {state === "init" || state === "processing" ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <LoadingFallback label="Preparazione del pagamento..." />
                </div>
              ) : null}
              <div id="payment-element" className={state === "ready" ? "" : "hidden"} />
              {state === "ready" && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="mt-4 w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Paga €{total.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}