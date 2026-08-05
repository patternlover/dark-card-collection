'use client'

import { useEffect, useRef } from 'react'

const OBJECTS = [
  { pos: 'left-[6%] top-[6%]', shape: 'h-3 w-3 border-2 border-[var(--accent)]', spin: '0.28' },
  { pos: 'right-[24%] top-[9%]', shape: 'text-lg font-black leading-none text-[var(--accent)]/50', text: '+', spin: '-0.18' },
  { pos: 'left-[42%] top-[13%]', shape: 'h-2 w-2 border-2 border-[var(--accent)]/60', spin: '0.26' },
  { pos: 'right-[10%] top-[17%]', shape: 'h-4 w-4 border-2 border-[var(--accent)]/40', spin: '-0.22' },
  { pos: 'left-[3%] top-[22%]', shape: 'text-sm font-black leading-none text-[var(--accent)]/40', text: '+', spin: '0.24' },
  { pos: 'right-[35%] top-[26%]', shape: 'h-2.5 w-2.5 border-2 border-[var(--accent)]/60', spin: '-0.3' },
  { pos: 'left-[55%] top-[31%]', shape: 'h-2 w-2 bg-white/20', spin: '0.3' },
  { pos: 'right-[6%] top-[35%]', shape: 'h-3 w-3 rounded-sm border-2 border-white/20', spin: '-0.28' },
  { pos: 'left-[14%] top-[39%]', shape: 'h-2 w-2 border-2 border-[var(--accent)]/70', spin: '0.32' },
  { pos: 'right-[22%] top-[43%]', shape: 'text-sm font-black leading-none text-[var(--accent)]/40', text: '+', spin: '-0.2' },
  { pos: 'left-[8%] top-[47%]', shape: 'h-2.5 w-2.5 border-2 border-[var(--accent)]/60', spin: '0.26' },
  { pos: 'right-[40%] top-[51%]', shape: 'h-2 w-2 border-2 border-[var(--accent)]/80', spin: '0.3' },
  { pos: 'left-[45%] top-[55%]', shape: 'h-3 w-3 border-2 border-[var(--accent)]', spin: '-0.28' },
  { pos: 'right-[12%] top-[59%]', shape: 'h-2 w-2 bg-white/20', spin: '0.32' },
  { pos: 'left-[24%] top-[63%]', shape: 'text-lg font-black leading-none text-[var(--accent)]/50', text: '+', spin: '-0.18' },
  { pos: 'right-[30%] top-[67%]', shape: 'h-1.5 w-1.5 border-2 border-[var(--accent)]/80', spin: '0.34' },
  { pos: 'left-[38%] top-[71%]', shape: 'h-2 w-2 border-2 border-[var(--accent)]/60', spin: '-0.26' },
  { pos: 'right-[6%] top-[75%]', shape: 'text-sm font-black leading-none text-[var(--accent)]/40', text: '+', spin: '0.24' },
  { pos: 'left-[12%] top-[79%]', shape: 'h-3 w-3 rounded-sm border-2 border-white/20', spin: '-0.28' },
  { pos: 'right-[44%] top-[83%]', shape: 'h-2.5 w-2.5 border-2 border-[var(--accent)]/60', spin: '0.3' },
  { pos: 'left-[56%] top-[87%]', shape: 'h-2 w-2 border-2 border-[var(--accent)]/70', spin: '0.32' },
  { pos: 'right-[18%] top-[91%]', shape: 'h-2 w-2 bg-white/20', spin: '-0.3' },
  { pos: 'left-[30%] top-[95%]', shape: 'h-1.5 w-1.5 border-2 border-[var(--accent)]/80', spin: '0.34' },
]

const GLOWS = [
  { pos: '-right-24 top-0', size: 'h-[420px] w-[420px]', color: 'bg-[var(--accent)]/20', delay: '', spin: '0.04' },
  { pos: 'left-1/3 top-[6%]', size: 'h-[280px] w-[280px]', color: 'bg-[var(--accent)]/10', delay: '[animation-delay:2.8s]', spin: '0.05' },
  { pos: '-left-32 top-[35%]', size: 'h-[380px] w-[380px]', color: 'bg-[var(--accent)]/10', delay: '[animation-delay:1.4s]', spin: '-0.03' },
  { pos: '-right-28 top-[55%]', size: 'h-[360px] w-[360px]', color: 'bg-[var(--accent)]/10', delay: '[animation-delay:3.6s]', spin: '0.03' },
  { pos: '-left-24 bottom-0', size: 'h-[420px] w-[420px]', color: 'bg-[var(--accent)]/10', delay: '[animation-delay:4.6s]', spin: '-0.04' },
]

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
      {GLOWS.map((glow, i) => (
        <div
          key={`glow-${i}`}
          className={`animate-hero-glow absolute rounded-full blur-3xl ${glow.pos} ${glow.size} ${glow.color} ${glow.delay}`}
          data-spin={glow.spin}
        />
      ))}

      {OBJECTS.map((obj, i) => (
        <div
          key={`obj-${i}`}
          className={`absolute ${obj.pos} ${obj.shape}`}
          data-spin={obj.spin}
        >
          {obj.text}
        </div>
      ))}
    </div>
  )
}
