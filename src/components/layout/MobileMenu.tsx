'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items: { label: string; href: string }[]
}

function isNavActive(pathname: string, href: string) {
  if (href === '/shop') {
    return pathname === '/shop' || (pathname.startsWith('/shop/') && !pathname.startsWith('/shop/collections'))
  }
  if (href === '/shop/collections') {
    return pathname === '/shop/collections' || pathname.startsWith('/shop/collections/')
  }
  return pathname === href
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu di navigazione"
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-black md:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b-2 border-zinc-700 px-4">
        <Link href="/" onClick={onClose} className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-white">DARK CARD</span>
          <span className="text-xl font-light text-[var(--accent)]">COLLECTION</span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi menu"
          className="flex h-10 w-10 items-center justify-center border-2 border-zinc-700 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col px-4 py-6">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={
              isNavActive(pathname, item.href)
                ? 'border-b border-zinc-800 py-5 text-2xl font-black uppercase tracking-wide text-[var(--accent)] underline decoration-[var(--accent)] decoration-2 underline-offset-8'
                : 'border-b border-zinc-800 py-5 text-2xl font-black uppercase tracking-wide text-white transition-colors hover:text-[var(--accent)]'
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
