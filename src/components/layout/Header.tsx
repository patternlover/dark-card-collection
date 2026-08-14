'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, Menu, X } from 'lucide-react'
import { MobileMenu } from './MobileMenu'
import { useCart } from '@/hooks/useCart'

const navItems = [
  { label: 'Shop', href: '/shop' },
  { label: 'Espansioni', href: '/shop/espansioni' },
  { label: 'Chi Siamo', href: '/info/about' },
  { label: 'FAQ', href: '/info/faq' },
  { label: 'Contatti', href: '/info/contact' },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { itemCount } = useCart()

  return (
    <header className="sticky top-[var(--banner-h)] z-[130] border-b-2 border-zinc-700 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              DARK CARD
            </span>
            <span className="text-xl font-light text-[var(--accent)]">
              COLLECTION
            </span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-[var(--accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/shop"
              className="hidden sm:flex items-center justify-center h-10 w-10 border-2 border-zinc-700 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Search className="h-5 w-5" />
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center justify-center h-10 w-10 border-2 border-zinc-700 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center border-2 border-black bg-[var(--accent)] text-[10px] font-bold text-black">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              className="md:hidden flex items-center justify-center h-10 w-10 border-2 border-zinc-700 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          items={navItems}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}
