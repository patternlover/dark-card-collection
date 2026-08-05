'use client'

import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface ConfettiBurstProps {
  x: number
  y: number
  onDone: () => void
}

const SPARK_COUNT = 26

export function ConfettiBurst({ x, y, onDone }: ConfettiBurstProps) {
  const sparks = useMemo(() => {
    return Array.from({ length: SPARK_COUNT }, (_, i) => {
      const angle = (i / SPARK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.7
      const distance = 46 + Math.random() * 74
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance + 28
      return {
        id: i,
        dx: dx.toFixed(1),
        dy: dy.toFixed(1),
        rot: ((angle * 180) / Math.PI + 90).toFixed(1),
        delay: (Math.random() * 70).toFixed(0),
        len: 8 + Math.random() * 8,
      }
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(onDone, 850)
    return () => clearTimeout(t)
  }, [onDone])

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-[110]"
      style={{ left: x, top: y }}
    >
      <span
        className="spark-flash absolute block rounded-full"
        style={{ left: -7, top: -7, width: 14, height: 14 }}
      />
      {sparks.map((s) => (
        <span
          key={s.id}
          className="spark-bit absolute block"
          style={
            {
              left: -1.5,
              top: -1.5,
              width: 3,
              height: s.len,
              '--sp-dx': `${s.dx}px`,
              '--sp-dy': `${s.dy}px`,
              '--sp-rot': `${s.rot}deg`,
              '--sp-delay': `${s.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )
}
