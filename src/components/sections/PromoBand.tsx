import Link from 'next/link'
import { Truck } from 'lucide-react'

export function PromoBand() {
  return (
    <section className="bg-black px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 border-2 border-[#FACC15] bg-zinc-900 p-8 shadow-[6px_6px_0px_0px_#FACC15] sm:flex-row sm:p-10">
          <div className="flex items-center gap-4">
            <div className="hidden h-14 w-14 items-center justify-center border-2 border-black bg-[#FACC15] sm:flex">
              <Truck className="h-7 w-7 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Spedizione gratuita sopra <span className="text-[#FACC15]">100 €</span>
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Ordini tracciati e assicurati su tutto il territorio italiano. Pagamenti sicuri con Stripe.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="inline-flex shrink-0 items-center gap-2 border-2 border-[#FACC15] bg-[#FACC15] px-6 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[3px_3px_0px_0px_#fff] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-0 active:shadow-none"
          >
            Sfoglia il catalogo
          </Link>
        </div>
      </div>
    </section>
  )
}
