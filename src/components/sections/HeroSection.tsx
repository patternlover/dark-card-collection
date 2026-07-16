import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Colleziona il meglio
            <span className="block text-blue-500">del Pokémon TCG</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Booster Box, ETB, Collection Box e prodotti sigillati delle ultime espansioni.
            Qualità garantita, spedizione tracciabile.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/shop"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Esplora lo Shop
            </Link>
            <Link
              href="/shop/preorders"
              className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-zinc-500"
            >
              Preordini
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
