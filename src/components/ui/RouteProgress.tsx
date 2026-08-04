'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function getRouteKey(pathname: string, searchParams: URLSearchParams) {
  return `${pathname}${searchParams ? searchParams.toString() : ''}`
}

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(true)
  const lastKeyRef = useRef('')

  useEffect(() => {
    lastKeyRef.current = getRouteKey(pathname, searchParams)
  }, [pathname, searchParams])

  useEffect(() => {
    function start() {
      if (!doneRef.current) return
      doneRef.current = false
      setVisible(true)
      setProgress(8)
      let p = 8
      timerRef.current = setInterval(() => {
        p = Math.min(90, p + (90 - p) * 0.1 + 0.6)
        setProgress(p)
      }, 130)
    }

    function finish() {
      if (doneRef.current) return
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        doneRef.current = true
        setProgress(0)
      }, 320)
    }

    if (typeof window === 'undefined') return

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
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1"
    >
      <div
        className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
