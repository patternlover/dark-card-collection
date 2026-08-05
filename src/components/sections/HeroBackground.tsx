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
    let lastSy = -1
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-spin]'))

    const onScroll = () => {
      sy = window.scrollY
    }

    const tick = () => {
      if (sy !== lastSy) {
        lastSy = sy
        const progress = Math.min(1, sy / window.innerHeight)
        const scale = 1.06 + progress * 0.02
        const rotateZ = progress * 1.2 + Math.sin(sy * 0.003) * 0.8
        const translateY = sy * 0.04
        el.style.transform = `scale(${scale.toFixed(4)}) rotate(${rotateZ.toFixed(3)}deg) translateY(${translateY.toFixed(2)}px)`
        for (const item of items) {
          const speed = parseFloat(item.dataset.spin || '0')
          item.style.rotate = `${((sy * speed) % 360).toFixed(2)}deg`
        }
      }
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
      <div className="animate-hero-glow absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[var(--accent)]/20 blur-3xl" data-spin="0.04" />
      <div className="animate-hero-glow absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-[var(--accent)]/10 blur-3xl [animation-delay:1.4s]" data-spin="-0.03" />
      <div className="animate-hero-glow absolute left-1/3 top-1/4 h-[280px] w-[280px] rounded-full bg-[var(--accent)]/10 blur-3xl [animation-delay:2.8s]" data-spin="0.05" />

      <div className="absolute left-[6%] top-[16%] h-3 w-3 border-2 border-[var(--accent)]" data-spin="0.28" />
      <div className="absolute left-[14%] top-[64%] h-2 w-2 border-2 border-[var(--accent)]/70" data-spin="0.32" />
      <div className="absolute bottom-[22%] right-[38%] h-2.5 w-2.5 border-2 border-[var(--accent)]/60" data-spin="-0.3" />
      <div className="absolute left-[42%] top-[12%] h-2 w-2 border-2 border-[var(--accent)]/60" data-spin="0.26" />
      <div className="absolute right-[10%] top-[55%] h-4 w-4 border-2 border-[var(--accent)]/40" data-spin="-0.22" />
      <div className="absolute left-[28%] bottom-[12%] h-1.5 w-1.5 border-2 border-[var(--accent)]/80" data-spin="0.34" />
      <div className="absolute right-[24%] top-[18%] text-lg font-black leading-none text-[var(--accent)]/50" data-spin="-0.18">+</div>
      <div className="absolute left-[3%] top-[38%] text-sm font-black leading-none text-[var(--accent)]/40" data-spin="0.24">+</div>
      <div className="absolute right-[6%] bottom-[10%] h-3 w-3 rounded-sm border-2 border-white/20" data-spin="-0.28" />
      <div className="absolute left-[55%] top-[70%] h-2 w-2 bg-white/20" data-spin="0.3" />
    </div>
  )
}
