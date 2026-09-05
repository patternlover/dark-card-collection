"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { loadStripe, Stripe, StripeElements } from "@stripe/stripe-js"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
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
    const data = await medusaFetch<{
      cart?: { order_id?: string | null; completed_at?: string | null }
    }>(`/carts/${cartId}`)
    if (data.cart?.order_id) return data.cart.order_id
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error("Ordine non ancora confermato")
}

export default function CheckoutPage() {
  const { items, cartId, shipping, total } = useCart()
  const { customer } = useAuth()
  const [state, setState] = useState<"init" | "ready" | "processing" | "error">("init")
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const stripeRef = useRef<Stripe | null>(null)
  const elementsRef = useRef<StripeElements | null>(null)

  useEffect(() => {
    if (customer?.email && !email) setEmail(customer.email)
  }, [customer, email])

  useEffect(() => {
    if (items.length === 0) return
    if (!cartId) {
      setError("Carrello non inizializzato")
      setState("error")
      return
    }

    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)

    async function init() {
      try {
        console.log("[checkout] init, cartId:", cartId)
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
          body: JSON.stringify({ cart_id: cartId, email: email || undefined }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok || !data.client_secret) {
          throw new Error(data.error || `Errore nel checkout (${res.status})`)
        }
        console.log("[checkout] client_secret ok")

        const stripe = await stripePromise
        if (!stripe) throw new Error("Impossibile caricare Stripe (chiave pubblicabile mancante?)")
        const elements = stripe.elements({ clientSecret: data.client_secret })
        const paymentElement = elements.create("payment")
        paymentElement.mount("#payment-element")
        stripeRef.current = stripe
        elementsRef.current = elements
        if (cancelled) return
        console.log("[checkout] Payment Element montato")
        setState("ready")
      } catch (err) {
        if (cancelled) return
        console.error("[checkout] init error:", err)
        const msg =
          err instanceof DOMException && err.name === "AbortError"
            ? "Il checkout ha impiegato troppo tempo. Riprova."
            : err instanceof Error
              ? err.message
              : "Errore nel checkout"
        setError(msg)
        setState("error")
      } finally {
        clearTimeout(timer)
      }
    }

    init()
    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [items, cartId, email, total])

  async function handleSubmit() {
    const stripe = stripeRef.current
    const elements = elementsRef.current
    if (!stripe || !elements || !cartId) return
    setState("processing")
    try {
      console.log("[checkout] confirmPayment...")
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })
      if (confirmError) {
        console.error("[checkout] confirmPayment error:", confirmError)
        const detail = confirmError.code
          ? `${confirmError.message} (${confirmError.code})`
          : confirmError.message || "Errore di pagamento"
        setError(detail)
        setState("ready")
        return
      }
      console.log("[checkout] pagamento ok, attendo ordine...")
      const orderId = await pollForOrderId(cartId)
      window.location.href = `/checkout/success?order_id=${orderId}`
    } catch (err) {
      console.error("[checkout] handleSubmit error:", err)
      setError(err instanceof Error ? err.message : "Errore di pagamento")
      setState("ready")
    }
  }

  if (items.length === 0) {
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
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {item.image ? (
                      <img src={item.image} alt={item.title} width={44} height={44} className="h-11 w-11 rounded border border-zinc-800 object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded border border-zinc-800 bg-zinc-800" />
                    )}
                    <div className="flex flex-1 justify-between gap-2">
                      <span className="text-zinc-300">{item.title}</span>
                      <span className="shrink-0 text-white">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm">
                  <span className="text-zinc-400">Spedizione</span>
                  <span className="text-white">{shipping === 0 ? "Gratuita" : `€${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-bold">
                  <span className="text-white">Totale</span>
                  <span className="text-[var(--accent)]">€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-zinc-600">
              <Lock className="h-3 w-3" /> Pagamento sicuro elaborato da Stripe
            </p>
          </div>

          <div className="lg:col-span-3">
            <div className="relative border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a]">
              <label className="mb-4 flex flex-col gap-1 text-sm text-zinc-400">
                Email per la conferma ordine
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.it"
                  className="border-2 border-zinc-700 bg-black px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

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
              {state === "error" && (
                <button
                  type="button"
                  onClick={() => setState("init")}
                  className="mt-4 w-full rounded-lg border border-zinc-600 px-6 py-3 text-sm font-semibold text-white hover:border-zinc-400"
                >
                  Riprova
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}