'use client'

import Link from 'next/link'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items: { label: string; href: string }[]
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="border-t border-zinc-800 bg-black md:hidden">
      <nav className="space-y-1 px-4 py-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="block py-3 text-base font-medium text-zinc-400 transition-colors hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
