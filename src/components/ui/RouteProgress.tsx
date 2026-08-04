'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function getRouteKey(pathname: string, searchParams: URLSearchParams) {
  return `${pathname}${searchParams.toString()}`
}

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  const valueRef = useRef(0)
  const targetRef = useRef(0)
  const activeRef = useRef(false)
  const rafRef = useRef<number>(0)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const start = () => {
      if (activeRef.current) return
      activeRef.current = true
      valueRef.current = 0
      targetRef.current = 22
      setVisible(true)
      setProgress(0)
    }

    const finish = () => {
      if (!activeRef.current) return
      targetRef.current = 100
    }

    const reset = () => {
      activeRef.current = false
      setVisible(false)
      setProgress(0)
      valueRef.current = 0
      targetRef.current = 0
    }

    const tick = () => {
      if (!activeRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const t = targetRef.current
      if (t < 100) {
        targetRef.current = Math.min(95, t + (95 - t) * 0.035 + 0.1)
      }
      const v = valueRef.current
      const d = t - v
      const next = d > 0.4 ? v + d * (t >= 100 ? 0.28 : 0.12) : t
      valueRef.current = next
      setProgress(next)
      if (t >= 100 && next >= 100) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(reset, 260)
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    if (!(window as unknown as { __routeProgressPatched?: boolean }).__routeProgressPatched) {
      ;(window as unknown as { __routeProgressPatched?: boolean }).__routeProgressPatched = true

      const wrap = (type: 'pushState' | 'replaceState') => {
        const original = history[type].bind(history)
        return (...args: Parameters<History['pushState']>) => {
          start()
          return original(...args)
        }
      }
      history.pushState = wrap('pushState')
      history.replaceState = wrap('replaceState')
      window.addEventListener('popstate', start)
    }

    const key = getRouteKey(pathname, searchParams)
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key
      finish()
    } else if (lastKeyRef.current === '') {
      lastKeyRef.current = key
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1">
      <div
        className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
