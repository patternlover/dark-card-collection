'use client'

import { useEffect, useRef } from 'react'

export function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let raf = 0
    let sy = 0

    const onScroll = () => {
      sy = window.scrollY
    }

    const tick = () => {
      const progress = Math.min(1, sy / window.innerHeight)
      const scale = 1.06 + progress * 0.02
      const rotateZ = progress * 1.2 + Math.sin(sy * 0.003) * 0.8
      const translateY = sy * 0.04
      el.style.transform = `scale(${scale.toFixed(4)}) rotate(${rotateZ.toFixed(3)}deg) translateY(${translateY.toFixed(2)}px)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 origin-center overflow-hidden will-change-transform"
    >
      <div className="animate-hero-glow absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[var(--accent)]/20 blur-3xl" />
      <div className="animate-hero-glow absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-[var(--accent)]/10 blur-3xl [animation-delay:1.4s]" />
      <div className="animate-hero-glow absolute left-1/3 top-1/4 h-[280px] w-[280px] rounded-full bg-[var(--accent)]/10 blur-3xl [animation-delay:2.8s]" />

      <div className="absolute left-[6%] top-[16%] h-3 w-3 rotate-12 border-2 border-[var(--accent)]" />
      <div className="absolute left-[14%] top-[64%] h-2 w-2 rounded-full bg-[var(--accent)]/70" />
      <div className="absolute bottom-[22%] right-[38%] h-2.5 w-2.5 rotate-45 border-2 border-[var(--accent)]/60" />
      <div className="absolute left-[42%] top-[12%] h-2 w-2 rounded-full bg-[var(--accent)]/60" />
      <div className="absolute right-[10%] top-[55%] h-4 w-4 rotate-45 border-2 border-[var(--accent)]/40" />
      <div className="absolute left-[28%] bottom-[12%] h-1.5 w-1.5 rounded-full bg-[var(--accent)]/80" />
      <div className="absolute right-[24%] top-[18%] text-lg font-black leading-none text-[var(--accent)]/50">+</div>
      <div className="absolute left-[3%] top-[38%] text-sm font-black leading-none text-[var(--accent)]/40">+</div>
      <div className="absolute right-[6%] bottom-[10%] h-3 w-3 rotate-12 rounded-sm border-2 border-white/20" />
      <div className="absolute left-[55%] top-[70%] h-2 w-2 rotate-45 bg-white/20" />
    </div>
  )
}
