'use client'

import { useState } from 'react'
import { CreditCard, Lock } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { items, subtotal, shipping, total, clearCart } = useCart()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (items.length === 0) {
      setError('Il carrello è vuoto')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await res.json()

      if (data.url) {
        clearCart()
        window.location.href = data.url
      } else {
        setError(data.error || 'Errore nel checkout')
        setIsLoading(false)
      }
    } catch {
      setError('Errore di connessione')
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-black">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-zinc-500">Il carrello è vuoto.</p>
          <a href="/shop" className="mt-4 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200">
            Torna allo shop
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="rounded-lg border border-zinc-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Riepilogo</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  {item.title} x{item.quantity}
                </span>
                <span className="text-white">€{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-zinc-800 pt-3 flex justify-between text-sm">
              <span className="text-zinc-400">Spedizione</span>
              <span className="text-white">{shipping === 0 ? 'Gratuita' : `€${shipping.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-zinc-800 pt-3 flex justify-between font-medium">
              <span className="text-white">Totale</span>
              <span className="text-white">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento sicuro con Stripe
            </h2>
            <p className="text-sm text-zinc-400">
              Verrai reindirizzato alla pagina di pagamento Stripe per completare l&apos;ordine in modo sicuro.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-base font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {isLoading ? 'Elaborazione...' : `Paga €${total.toFixed(2)}`}
          </button>

          <p className="text-center text-xs text-zinc-600">
            Pagamento elaborato da Stripe. I tuoi dati sono al sicuro.
          </p>
        </form>
      </div>
    </div>
  )
}
