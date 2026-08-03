import Link from 'next/link'
import { ArrowRight, Zap, PackageCheck, ShieldCheck } from 'lucide-react'

const stats = [
  { icon: ShieldCheck, label: '100% originali' },
  { icon: Zap, label: 'Spedizione rapida' },
  { icon: PackageCheck, label: 'Packaging sicuro' },
]

function GengarBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="animate-gengar-glow absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[#7C3AED]/25 blur-3xl" />
      <div className="animate-gengar-glow absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-[#A78BFA]/15 blur-3xl [animation-delay:1.4s]" />

      <div className="animate-gengar-bob absolute -top-4 right-4 opacity-90 sm:right-14">
        <svg width="200" height="186" viewBox="0 0 240 220" fill="none">
          <path
            d="M50 118 C44 70 70 46 120 46 C170 46 196 70 190 118 C198 150 198 172 194 196 L164 196 L120 176 L76 196 L46 196 C42 172 42 150 50 118 Z"
            fill="#7C3AED"
          />
          <path d="M62 64 L50 28 L88 46 Z" fill="#7C3AED" />
          <path d="M178 64 L190 28 L152 46 Z" fill="#7C3AED" />
          <path
            d="M92 50 L100 30 L112 48 L120 26 L128 48 L140 30 L148 50"
            stroke="#7C3AED"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse cx="90" cy="128" rx="17" ry="23" fill="#FDE68A" />
          <ellipse cx="150" cy="128" rx="17" ry="23" fill="#FDE68A" />
          <ellipse cx="94" cy="134" rx="8" ry="11" fill="#111827" />
          <ellipse cx="146" cy="134" rx="8" ry="11" fill="#111827" />
          <path d="M82 168 C102 194 138 194 158 168 C150 182 132 190 120 190 C108 190 90 182 82 168 Z" fill="#FFFFFF" />
          <path d="M104 180 L108 194 L112 180 Z" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2" />
          <path d="M128 180 L132 194 L136 180 Z" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2" />
        </svg>
      </div>

      <div className="animate-gengar-bob absolute left-[6%] top-[16%] h-3 w-3 rotate-12 border-2 border-[#7C3AED] [animation-delay:0.7s]" />
      <div className="animate-gengar-bob absolute left-[14%] top-[64%] h-2 w-2 rounded-full bg-[#A78BFA]/70 [animation-delay:1.3s]" />
      <div className="animate-gengar-bob absolute bottom-[22%] right-[38%] h-2.5 w-2.5 rotate-45 border-2 border-[#A78BFA]/60 [animation-delay:1.9s]" />
      <div className="animate-gengar-bob absolute left-[42%] top-[12%] h-2 w-2 rounded-full bg-[#7C3AED]/60 [animation-delay:0.4s]" />
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-2 border-zinc-700 bg-black">
      <GengarBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="inline-block border-2 border-[#FACC15] bg-[#FACC15] px-3 py-1 text-xs font-black uppercase tracking-widest text-black shadow-[3px_3px_0px_0px_#fff]">
              Nuovi arrivi ogni settimana
            </span>

            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Colleziona
              <span className="block text-[#FACC15]">il meglio</span>
              del Pokémon TCG
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400 lg:mx-0">
              Booster Box, ETB, Collection Box e prodotti sigillati delle ultime
              espansioni. Qualità garantita, spedizione tracciabile.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 border-2 border-[#FACC15] bg-[#FACC15] px-7 py-3.5 text-sm font-black uppercase tracking-wide text-black shadow-[4px_4px_0px_0px_#fff] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#fff] active:translate-0 active:shadow-none"
              >
                Esplora lo Shop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/shop/preorders"
                className="inline-flex items-center gap-2 border-2 border-zinc-500 bg-zinc-900 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_0px_#27272a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#FACC15] hover:text-[#FACC15] hover:shadow-[6px_6px_0px_0px_#FACC15] active:translate-0 active:shadow-none"
              >
                Preordini
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="relative rotate-2 border-2 border-[#FACC15] bg-[#FACC15] p-6 shadow-[8px_8px_0px_0px_#fff] transition-transform duration-200 hover:rotate-0">
              <p className="text-xs font-black uppercase tracking-widest text-black/60">Featured</p>
              <p className="mt-2 text-2xl font-black uppercase leading-tight text-black">
                Sigillati, originali, pronti da collezionare
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="border-2 border-black bg-black p-3 text-center">
                  <p className="text-2xl font-black text-[#FACC15]">100%</p>
                  <p className="text-[11px] font-bold uppercase text-white">Originali</p>
                </div>
                <div className="border-2 border-black bg-black p-3 text-center">
                  <p className="text-2xl font-black text-[#FACC15]">24h</p>
                  <p className="text-[11px] font-bold uppercase text-white">Spedizione</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 -rotate-3 border-2 border-black bg-white px-4 py-2 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xs font-black uppercase tracking-widest text-black">
                ★ Collezione 2026
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t-2 border-zinc-800 pt-8 lg:justify-start">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
                <Icon className="h-4 w-4 text-[#FACC15]" />
                {stat.label}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
