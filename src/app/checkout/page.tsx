'use client'

import { useState } from 'react'
import { CreditCard, Lock } from 'lucide-react'

const placeholderCartItems = [
  { title: 'Booster Box Scarlet & Violet', price: 149.99, quantity: 1 },
  { title: 'ETB Paldea Evolved', price: 54.99, quantity: 2 },
]

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: placeholderCartItems }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping Info */}
          <div className="rounded-lg border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Informazioni di spedizione
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm text-zinc-400 mb-2">
                  Nome e Cognome
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Mario Rossi"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="mario@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm text-zinc-400 mb-2">
                  Indirizzo
                </label>
                <input
                  type="text"
                  id="address"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Via Roma 1"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm text-zinc-400 mb-2">
                  Città
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Roma"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm text-zinc-400 mb-2">
                  CAP
                </label>
                <input
                  type="text"
                  id="postalCode"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  placeholder="00100"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-lg border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento sicuro con Stripe
            </h2>
            <p className="text-sm text-zinc-400">
              Verrai reindirizzato alla pagina di pagamento Stripe per completare l&apos;ordine in modo sicuro.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-base font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {isLoading ? 'Elaborazione...' : 'Paga con Stripe'}
          </button>

          <p className="text-center text-xs text-zinc-600">
            Pagamento elaborato da Stripe. I tuoi dati sono al sicuro.
          </p>
        </form>
      </div>
    </div>
  )
}
