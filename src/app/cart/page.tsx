'use client'

import Link from 'next/link'
import { Trash2, ShoppingBag } from 'lucide-react'

// Placeholder cart items
const cartItems = [
  {
    id: '1',
    title: 'Booster Box Scarlet & Violet',
    slug: 'booster-box-scarlet-violet',
    price: 149.99,
    quantity: 1,
    image: null,
  },
  {
    id: '2',
    title: 'ETB Paldea Evolved',
    slug: 'etb-paldea-evolved',
    price: 54.99,
    quantity: 2,
    image: null,
  },
]

export default function CartPage() {
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal >= 100 ? 0 : 9.99
  const total = subtotal + shipping

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Carrello</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">Il carrello è vuoto</p>
            <Link
              href="/shop"
              className="inline-block mt-4 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              Continua lo shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-zinc-800 p-4"
                >
                  <div className="h-24 w-24 flex-shrink-0 rounded bg-zinc-800" />
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-white hover:text-blue-400"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        Qtà: {item.quantity}
                      </span>
                      <span className="text-sm font-medium text-white">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-zinc-500 hover:text-red-500"
                    aria-label="Rimuovi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border border-zinc-800 p-6 h-fit">
              <h2 className="text-lg font-semibold text-white mb-4">
                Riepilogo ordine
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotale</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Spedizione</span>
                  <span>{shipping === 0 ? 'Gratuita' : `€${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-zinc-600">
                    Spedizione gratuita per ordini sopra i €100
                  </p>
                )}
                <div className="border-t border-zinc-800 pt-3 flex justify-between font-medium text-white">
                  <span>Totale</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                Procedi al checkout
              </Link>

              <Link
                href="/shop"
                className="mt-3 flex w-full items-center justify-center text-sm text-zinc-400 hover:text-white"
              >
                Continua lo shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
