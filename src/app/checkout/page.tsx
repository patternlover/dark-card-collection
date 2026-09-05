"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CreditCard, Landmark, Lock } from "lucide-react"
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripePaymentElement,
} from "@stripe/stripe-js"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { trackBeginCheckout } from "@/lib/analytics"
import { medusaFetch } from "@/lib/medusa/client"
import {
  EMPTY_ADDRESS,
  STRIPE_APPEARANCE,
  saveOrderSnapshot,
  validateCheckoutForm,
  type CheckoutAddress,
  type OrderSummary,
} from "@/lib/checkout"
import { LoadingFallback } from "@/components/ui/LoadingFallback"
import { Reveal } from "@/components/ui/Reveal"
import { Breadcrumb } from "@/components/ui/Breadcrumb"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
)

type PayMethod = "card" | "transfer"

interface PrepareResponse {
  client_secret?: string
  order_id?: string
  order?: OrderSummary
  ok?: boolean
  error?: string
}

interface CompleteResponse {
  order_id?: string
  order?: OrderSummary
  error?: string
  retryable?: boolean
}

const COMPLETE_RETRIES = 12
const COMPLETE_DELAY_MS = 2500

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function prepareCheckout(payload: {
  cart_id: string
  provider: "stripe" | "system"
  email?: string
  shipping_address?: CheckoutAddress
  sync_only?: boolean
}): Promise<PrepareResponse> {
  const res = await fetch("/api/medusa/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as PrepareResponse
  if (!res.ok) throw new Error(data.error || `Errore nel checkout (${res.status})`)
  return data
}

/** Chiama `cart/complete` finché il webhook Stripe autorizza la sessione. */
async function completeWithRetry(cartId: string): Promise<OrderSummary> {
  let lastError = "Ordine non ancora confermato"
  for (let i = 0; i < COMPLETE_RETRIES; i++) {
    const res = await fetch("/api/medusa/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cartId }),
    })
    const data = (await res.json()) as CompleteResponse
    if (res.ok && data.order) return data.order
    lastError = data.error || lastError
    if (!data.retryable) break
    await wait(COMPLETE_DELAY_MS)
  }
  throw new Error(lastError)
}

const inputClass =
  "border-2 border-zinc-700 bg-black px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"

export default function CheckoutPage() {
  const { items, cartId, shipping, total } = useCart()
  const { customer } = useAuth()
  const [method, setMethod] = useState<PayMethod>("card")
  const [state, setState] = useState<"init" | "ready" | "processing" | "error">("init")
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS)
  const stripeRef = useRef<Stripe | null>(null)
  const elementsRef = useRef<StripeElements | null>(null)
  const paymentElementRef = useRef<StripePaymentElement | null>(null)
  const clientSecretRef = useRef<string | null>(null)
  const initializedRef = useRef<string | null>(null)

  useEffect(() => {
    if (customer?.email && !email) setEmail(customer.email)
  }, [customer, email])

  function setField(field: keyof CheckoutAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  // Init una tantum per (carrello, metodo): il form resta fuori dalle deps così
  // digitare email/indirizzo non re-inizializza il Payment Element.
  useEffect(() => {
    if (items.length === 0 || !cartId || method !== "card") return
    const key = `${cartId}:card`
    if (initializedRef.current === key) return
    initializedRef.current = key

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
          body: JSON.stringify({ cart_id: cartId }),
          signal: controller.signal,
        })
        const data = (await res.json()) as PrepareResponse
        if (!res.ok || !data.client_secret) {
          throw new Error(data.error || `Errore nel checkout (${res.status})`)
        }
        console.log("[checkout] client_secret ok")

        const stripe = await stripePromise
        if (!stripe)
          throw new Error("Impossibile caricare Stripe (chiave pubblicabile mancante?)")
        paymentElementRef.current?.unmount()
        const elements = stripe.elements({
          clientSecret: data.client_secret,
          appearance: STRIPE_APPEARANCE,
        })
        const paymentElement = elements.create("payment")
        paymentElement.mount("#payment-element")
        stripeRef.current = stripe
        elementsRef.current = elements
        paymentElementRef.current = paymentElement
        clientSecretRef.current = data.client_secret
        if (cancelled) return
        console.log("[checkout] Payment Element montato")
        setError("")
        setState("ready")
      } catch (err) {
        if (cancelled) return
        initializedRef.current = null
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
  }, [items, cartId, method, total])

  // Cambio metodo: smonta l'Element e resetta l'init.
  function switchMethod(next: PayMethod) {
    if (next === method) return
    paymentElementRef.current?.unmount()
    paymentElementRef.current = null
    elementsRef.current = null
    clientSecretRef.current = null
    setMethod(next)
    setError("")
    setState(next === "card" ? "init" : "ready")
    if (next === "card") initializedRef.current = null
  }

  async function handleCardSubmit() {
    const stripe = stripeRef.current
    const elements = elementsRef.current
    const clientSecret = clientSecretRef.current
    if (!stripe || !elements || !cartId || !clientSecret) {
      setError("Sessione di pagamento non pronta. Riprova.")
      return
    }
    const formErrors = validateCheckoutForm(email, address)
    if (formErrors.length > 0) {
      setError(formErrors[0])
      return
    }
    setState("processing")
    setError("")
    try {
      // Solo sync di email + indirizzi: NON ricreare la sessione, altrimenti
      // l'intent montato nell'Element diventa obsoleto (unexpected_state).
      await prepareCheckout({
        cart_id: cartId,
        provider: "stripe",
        email: email.trim(),
        shipping_address: { ...address, country_code: "it" },
        sync_only: true,
      })

      // Se l'intent è già confermato (es. retry dopo un pagamento riuscito ma
      // con ordine non completato), si salta la conferma e si completa l'ordine.
      const current = await stripe.retrievePaymentIntent(clientSecret)
      if (
        current.paymentIntent?.status === "succeeded" ||
        current.paymentIntent?.status === "requires_capture"
      ) {
        console.log("[checkout] intent già confermato, completo l'ordine...")
        const order = await completeWithRetry(cartId)
        saveOrderSnapshot(order)
        window.location.href = `/checkout/success?order_id=${order.orderId}`
        return
      }

      console.log("[checkout] confirmPayment...")
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })
      if (confirmError) {
        console.error("[checkout] confirmPayment error:", confirmError)
        // L'intent potrebbe essere andato a buon fine comunque (doppio click,
        // retry): prima di mostrare l'errore si ricontrolla lo stato reale.
        if (confirmError.code === "payment_intent_unexpected_state") {
          const retry = await stripe.retrievePaymentIntent(clientSecret)
          if (
            retry.paymentIntent?.status === "succeeded" ||
            retry.paymentIntent?.status === "requires_capture"
          ) {
            console.log("[checkout] pagamento già riuscito, completo l'ordine...")
            const order = await completeWithRetry(cartId)
            saveOrderSnapshot(order)
            window.location.href = `/checkout/success?order_id=${order.orderId}`
            return
          }
        }
        const detail = confirmError.code
          ? `${confirmError.message} (${confirmError.code})`
          : confirmError.message || "Errore di pagamento"
        setError(detail)
        setState("ready")
        return
      }
      console.log("[checkout] pagamento ok, completo l'ordine...")
      const order = await completeWithRetry(cartId)
      saveOrderSnapshot(order)
      window.location.href = `/checkout/success?order_id=${order.orderId}`
    } catch (err) {
      console.error("[checkout] handleSubmit error:", err)
      setError(err instanceof Error ? err.message : "Errore di pagamento")
      setState("ready")
    }
  }

  async function handleTransferSubmit() {
    if (!cartId) return
    const formErrors = validateCheckoutForm(email, address)
    if (formErrors.length > 0) {
      setError(formErrors[0])
      return
    }
    setState("processing")
    setError("")
    try {
      const data = await prepareCheckout({
        cart_id: cartId,
        provider: "system",
        email: email.trim(),
        shipping_address: { ...address, country_code: "it" },
      })
      if (!data.order) throw new Error("Ordine non creato, riprova.")
      saveOrderSnapshot(data.order)
      window.location.href = `/checkout/success?order_id=${data.order.orderId}`
    } catch (err) {
      console.error("[checkout] transfer error:", err)
      setError(err instanceof Error ? err.message : "Errore nella creazione dell'ordine")
      setState("ready")
    }
  }

  function handleRetry() {
    initializedRef.current = null
    paymentElementRef.current?.unmount()
    paymentElementRef.current = null
    clientSecretRef.current = null
    setError("")
    if (method === "transfer") {
      setState("ready")
    } else {
      setState("init")
      // Forza il re-init cambiando la chiave.
      initializedRef.current = null
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
              <Lock className="h-3 w-3" />{" "}
              {method === "card"
                ? "Pagamento sicuro elaborato da Stripe"
                : "Ordine con pagamento tramite bonifico bancario"}
            </p>
          </div>

          <div className="lg:col-span-3">
            <div className="relative border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a]">
              <div className="mb-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchMethod("card")}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold ${
                    method === "card"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Carta
                </button>
                <button
                  type="button"
                  onClick={() => switchMethod("transfer")}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold ${
                    method === "transfer"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <Landmark className="h-4 w-4" /> Bonifico
                </button>
              </div>

              <label className="mb-4 flex flex-col gap-1 text-sm text-zinc-400">
                Email per la conferma ordine
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.it"
                  className={inputClass}
                />
              </label>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Nome
                  <input
                    type="text"
                    required
                    value={address.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    placeholder="Mario"
                    autoComplete="given-name"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Cognome
                  <input
                    type="text"
                    required
                    value={address.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    placeholder="Rossi"
                    autoComplete="family-name"
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="mb-4 flex flex-col gap-1 text-sm text-zinc-400">
                Indirizzo di spedizione
                <input
                  type="text"
                  required
                  value={address.address_1}
                  onChange={(e) => setField("address_1", e.target.value)}
                  placeholder="Via Roma 1"
                  autoComplete="street-address"
                  className={inputClass}
                />
              </label>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Città
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Roma"
                    autoComplete="address-level2"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  CAP
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={address.postal_code}
                    onChange={(e) => setField("postal_code", e.target.value)}
                    placeholder="00100"
                    autoComplete="postal-code"
                    className={inputClass}
                  />
                </label>
              </div>
              <p className="mb-6 text-xs text-zinc-600">Spedizione in Italia.</p>

              {method === "transfer" && (
                <div className="mb-4 rounded-lg border border-zinc-700 bg-black p-4 text-sm text-zinc-300">
                  Riceverai via email le coordinate per il bonifico. L&apos;ordine viene
                  spedito alla ricezione del pagamento.
                </div>
              )}

              {method === "card" && (state === "init" || state === "processing") ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <LoadingFallback label="Preparazione del pagamento..." />
                </div>
              ) : null}
              {method === "card" && <div id="payment-element" className={state === "ready" ? "" : "hidden"} />}

              {state === "ready" && method === "card" && (
                <button
                  type="button"
                  onClick={() => void handleCardSubmit()}
                  className="mt-4 w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Paga €{total.toFixed(2)}
                </button>
              )}
              {state === "ready" && method === "transfer" && (
                <button
                  type="button"
                  onClick={() => void handleTransferSubmit()}
                  className="mt-4 w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Conferma ordine (€{total.toFixed(2)} con bonifico)
                </button>
              )}
              {state === "processing" && method === "transfer" && (
                <div className="flex min-h-[80px] items-center justify-center">
                  <LoadingFallback label="Creazione dell'ordine..." />
                </div>
              )}
              {state === "error" && (
                <button
                  type="button"
                  onClick={handleRetry}
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
