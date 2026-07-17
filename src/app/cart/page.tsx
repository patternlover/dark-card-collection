'use client'

import Link from 'next/link'
import { Trash2, ShoppingBag, Minus, Plus } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total } = useCart()

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Carrello</h1>

        {items.length === 0 ? (
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
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-zinc-800 p-4"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-24 w-24 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 flex-shrink-0 rounded bg-zinc-800 flex items-center justify-center">
                      <span className="text-zinc-600 text-2xl">📦</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-white hover:text-blue-400"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded border border-zinc-700 p-1 text-zinc-400 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded border border-zinc-700 p-1 text-zinc-400 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        €{item.price.toFixed(2)} cad.
                      </span>
                      <span className="text-sm font-medium text-white">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-red-500"
                    aria-label="Rimuovi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

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
