'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, Menu, X } from 'lucide-react'
import { MobileMenu } from './MobileMenu'

const navItems = [
  { label: 'Shop', href: '/shop' },
  { label: 'Collezioni', href: '/shop/collections' },
  { label: 'Preordini', href: '/shop/preorders' },
  { label: 'Novità', href: '/shop/new-arrivals' },
  { label: 'Bestseller', href: '/shop/bestsellers' },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Dark Card
            </span>
            <span className="text-xl font-light text-zinc-400">
              Collection
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-zinc-400 transition-colors hover:text-white"
              aria-label="Cerca"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href="/cart"
              className="relative text-zinc-400 transition-colors hover:text-white"
              aria-label="Carrello"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                0
              </span>
            </Link>

            <button
              type="button"
              className="text-zinc-400 transition-colors hover:text-white md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navItems}
      />
    </header>
  )
}
