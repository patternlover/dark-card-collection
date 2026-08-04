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

    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-x]'))
    let raf = 0
    let sy = window.scrollY

    const onScroll = () => {
      sy = window.scrollY
    }

    const tick = (now: number) => {
      const progress = Math.min(1, sy / window.innerHeight)
      const scale = 1.06 + progress * 0.02
      const rotateZ = progress * 1.2 + Math.sin(sy * 0.003) * 0.8
      const translateY = sy * 0.04
      el.style.transform = `scale(${scale.toFixed(4)}) rotate(${rotateZ.toFixed(3)}deg) translateY(${translateY.toFixed(2)}px)`

      const t = now / 1000
      for (const item of items) {
        const x = parseFloat(item.dataset.x || '0')
        const y = parseFloat(item.dataset.y || '0')
        const phase = parseFloat(item.dataset.phase || '0')
        const floatX = Math.cos(t * 1.1 + phase) * 7
        const floatY = Math.sin(t * 1.4 + phase) * 11
        const rot = Math.sin(t * 0.8 + phase) * 4
        item.style.transform = `translate3d(${(sy * x + floatX).toFixed(1)}px, ${(sy * y + floatY).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`
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
      <div
        data-x="-0.06"
        data-y="0.05"
        data-phase="0"
        className="animate-hero-glow absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[var(--accent)]/20 blur-3xl"
      />
      <div
        data-x="0.05"
        data-y="-0.04"
        data-phase="1.2"
        className="animate-hero-glow absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-[var(--accent)]/10 blur-3xl [animation-delay:1.4s]"
      />
      <div
        data-x="-0.03"
        data-y="0.08"
        data-phase="2.4"
        className="animate-hero-glow absolute left-1/3 top-1/4 h-[280px] w-[280px] rounded-full bg-[var(--accent)]/10 blur-3xl [animation-delay:2.8s]"
      />

      <div
        data-x="0.12"
        data-y="-0.1"
        data-phase="0.7"
        className="absolute left-[6%] top-[16%] h-3 w-3 border-2 border-[var(--accent)]"
      />
      <div
        data-x="-0.08"
        data-y="0.14"
        data-phase="1.3"
        className="absolute left-[14%] top-[64%] h-2 w-2 rounded-full bg-[var(--accent)]/70"
      />
      <div
        data-x="0.1"
        data-y="0.06"
        data-phase="1.9"
        className="absolute bottom-[22%] right-[38%] h-2.5 w-2.5 border-2 border-[var(--accent)]/60"
      />
      <div
        data-x="-0.12"
        data-y="-0.08"
        data-phase="0.4"
        className="absolute left-[42%] top-[12%] h-2 w-2 rounded-full bg-[var(--accent)]/60"
      />
      <div
        data-x="0.06"
        data-y="0.12"
        data-phase="2.4"
        className="absolute right-[10%] top-[55%] h-4 w-4 border-2 border-[var(--accent)]/40"
      />
      <div
        data-x="-0.05"
        data-y="0.1"
        data-phase="1.1"
        className="absolute left-[28%] bottom-[12%] h-1.5 w-1.5 rounded-full bg-[var(--accent)]/80"
      />
      <div
        data-x="0.09"
        data-y="-0.12"
        data-phase="1.6"
        className="absolute right-[24%] top-[18%] text-lg font-black leading-none text-[var(--accent)]/50"
      >
        +
      </div>
      <div
        data-x="-0.1"
        data-y="0.05"
        data-phase="2.1"
        className="absolute left-[3%] top-[38%] text-sm font-black leading-none text-[var(--accent)]/40"
      >
        +
      </div>
      <div
        data-x="0.14"
        data-y="-0.06"
        data-phase="0.9"
        className="absolute right-[6%] bottom-[10%] h-3 w-3 rounded-sm border-2 border-white/20"
      />
      <div
        data-x="-0.07"
        data-y="0.09"
        data-phase="1.7"
        className="absolute left-[55%] top-[70%] h-2 w-2 bg-white/20"
      />
    </div>
  )
}
