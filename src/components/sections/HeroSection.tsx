import Link from 'next/link'
import { ArrowRight, Zap, PackageCheck, ShieldCheck } from 'lucide-react'
import { HeroBackground } from './HeroBackground'
import { Reveal } from '@/components/ui/Reveal'

const stats = [
  { icon: ShieldCheck, label: '100% originali' },
  { icon: Zap, label: 'Spedizione rapida' },
  { icon: PackageCheck, label: 'Packaging sicuro' },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-2 border-zinc-700 bg-black">
      <HeroBackground />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="text-center lg:text-left">
            <span className="inline-block border-2 border-[var(--accent)] bg-[var(--accent)] px-3 py-1 text-xs font-black uppercase tracking-widest text-black shadow-[3px_3px_0px_0px_#fff]">
              Nuovi arrivi ogni settimana
            </span>

            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Colleziona
              <span className="block text-[var(--accent)]">il meglio</span>
              del Pokémon TCG
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400 lg:mx-0">
              Booster Box, ETB, Collection Box e prodotti sigillati delle ultime
              espansioni. Qualità garantita, spedizione tracciabile.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 border-2 border-[var(--accent)] bg-[var(--accent)] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-black shadow-[4px_4px_0px_0px_#fff] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#fff] active:translate-0 active:shadow-none"
              >
                Esplora lo Shop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/shop/preorders"
                className="inline-flex items-center gap-2 border-2 border-zinc-500 bg-zinc-900 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_#27272a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[6px_6px_0px_0px_var(--accent)] active:translate-0 active:shadow-none"
              >
                Preordini
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150} className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="relative rotate-2 border-2 border-[var(--accent)] bg-[var(--accent)] p-6 shadow-[8px_8px_0px_0px_#fff] transition-transform duration-200 hover:rotate-0">
              <p className="text-xs font-black uppercase tracking-widest text-black/60">Featured</p>
              <p className="mt-2 text-2xl font-black uppercase leading-tight text-black">
                Sigillati, originali, pronti da collezionare
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="border-2 border-black bg-black p-3 text-center">
                  <p className="text-2xl font-black text-[var(--accent)]">100%</p>
                  <p className="text-[11px] font-bold uppercase text-white">Originali</p>
                </div>
                <div className="border-2 border-black bg-black p-3 text-center">
                  <p className="text-2xl font-black text-[var(--accent)]">24h</p>
                  <p className="text-[11px] font-bold uppercase text-white">Spedizione</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 -rotate-3 border-2 border-black bg-white px-4 py-2 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xs font-black uppercase tracking-widest text-black">
                ★ Collezione 2026
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t-2 border-zinc-800 pt-8 lg:justify-start">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
                <Icon className="h-4 w-4 text-[var(--accent)]" />
                {stat.label}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
