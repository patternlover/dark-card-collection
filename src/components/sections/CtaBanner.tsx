import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden border-t-2 border-zinc-700 bg-zinc-900">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[#FACC15]/25 animate-spin-slow"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 border-2 border-[#FACC15] bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FACC15] animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              Nuovi arrivi ogni settimana
            </span>
            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              La collezione
              <span className="block text-[#FACC15]">cresce in fretta</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-zinc-400 lg:mx-0">
              Booster Box, ETB e Collection Box sigillati arrivano di continuo.
              Blocca i tuoi preferiti prima che vadano via.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-6">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-[#FACC15]/40"
              />
              <div className="animate-float border-2 border-black bg-[#FACC15] px-6 py-4 text-center shadow-[5px_5px_0px_0px_#fff]">
                <p className="text-3xl font-black text-black">60 €</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-black">
                  e la spedizione è gratis
                </p>
              </div>
            </div>

            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 border-2 border-[#FACC15] bg-[#FACC15] px-8 py-4 text-sm font-black uppercase tracking-wide text-black shadow-[5px_5px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#000] active:translate-0 active:shadow-none"
            >
              Scopri lo Shop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
