'use client'

import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface ConfettiBurstProps {
  x: number
  y: number
  onDone: () => void
}

const COLORS = ['var(--accent)', '#ffffff', '#71717a', '#facc15']
const PARTICLE_COUNT = 24

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function ConfettiBurst({ x, y, onDone }: ConfettiBurstProps) {
  const particles = useMemo(() => {
    if (prefersReducedMotion()) return []
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5
      const distance = 36 + Math.random() * 42
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        color: COLORS[i % COLORS.length],
        width: 5 + Math.random() * 4,
        height: 5 + Math.random() * 4,
        delay: Math.random() * 60,
        rotate: Math.random() * 360,
      }
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [onDone])

  if (particles.length === 0) return null

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-[120]"
      style={{ left: x, top: y }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute block rounded-sm"
          style={
            {
              left: 0,
              top: 0,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              '--cf-dx': `${p.dx}px`,
              '--cf-dy': `${p.dy}px`,
              '--cf-rotate': `${p.rotate}deg`,
              animation: `confetti-burst 700ms cubic-bezier(0.22, 1, 0.36, 1) ${p.delay}ms forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )
}
