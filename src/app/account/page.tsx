"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { LoadingFallback } from "@/components/ui/LoadingFallback"
import { Breadcrumb } from "@/components/ui/Breadcrumb"

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  completed: "Completato",
  draft: "Bozza",
  archived: "Archiviato",
  canceled: "Annullato",
}

export default function AccountPage() {
  const { customer, loading, logout, orders, refreshOrders } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !customer) router.replace("/account/login")
    if (customer) refreshOrders()
  }, [loading, customer, refreshOrders, router])

  if (loading || !customer) {
    return (
      <div className="bg-black">
        <div className="mx-auto flex min-h-[40vh] max-w-4xl items-center justify-center px-4">
          <LoadingFallback label="Caricamento account..." />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Breadcrumb
          className="mb-6"
          items={[{ label: "Home", href: "/" }, { label: "Il mio account" }]}
        />
        <h1 className="mb-6 text-3xl font-black uppercase tracking-tight text-white">
          Il mio account
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a] lg:col-span-1">
            <p className="text-sm text-zinc-500">Benvenuto,</p>
            <p className="mt-1 text-lg font-bold text-white">
              {customer.first_name || customer.email}
            </p>
            <p className="mt-1 text-sm text-zinc-400">{customer.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-6 w-full rounded-lg border border-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:border-red-500 hover:text-red-400"
            >
              Esci
            </button>
            <Link
              href="/shop"
              className="mt-3 block rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-black hover:bg-zinc-200"
            >
              Continua lo shopping
            </Link>
          </div>

          <div className="border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a] lg:col-span-2">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wide text-white">
              Storico ordini
            </h2>
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nessun ordine presente. I tuoi acquisti compariranno qui dopo il primo checkout.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-white">
                        Ordine #{order.display_id ?? order.id.slice(-8)}
                      </span>
                      <span className="text-zinc-400">
                        {STATUS_LABELS[order.status ?? ""] ?? order.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm text-zinc-400">
                      <span>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("it-IT")
                          : ""}{" "}
                        · {order.items?.length ?? 0} articoli
                      </span>
                      <span className="text-white">
                        €{Number(order.total ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}