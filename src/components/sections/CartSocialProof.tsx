'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'

const STORAGE_KEY = 'dcc-proof-base'

function seedForToday(): number {
  const d = new Date()
  const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  let h = 0
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0
  return 80 + (h % 120)
}

export function CartSocialProof() {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let base = seedForToday()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.day === new Date().toDateString() && typeof parsed.base === 'number') {
          base = parsed.base
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: new Date().toDateString(), base }))
    } catch {
      // ignore
    }

    setCount(base)
    setMounted(true)

    const onAdd = () => setCount((c) => c + 1)
    window.addEventListener('dcc:cart-add', onAdd)
    return () => window.removeEventListener('dcc:cart-add', onAdd)
  }, [])

  if (!mounted) return null

  return (
    <div className="border-b-2 border-zinc-700">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center">
        <ShoppingBag className="h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={2.5} />
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-300 sm:text-sm">
          <span className="font-black text-[var(--accent)]">{count}</span>{' '}
          collezionisti hanno aggiunto al carrello nelle ultime 24 ore
        </p>
      </div>
    </div>
  )
}
