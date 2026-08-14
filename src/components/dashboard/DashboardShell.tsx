'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Tag, Layers, Receipt, MessageSquare, Settings, Terminal, LogOut, Menu, X, Tags } from 'lucide-react'
import { logout } from '@/app/dashboard/actions'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Vendite',
    items: [
      { href: '/dashboard', label: 'Panoramica', icon: LayoutDashboard },
      { href: '/dashboard/orders', label: 'Ordini', icon: ShoppingBag },
    ],
  },
  {
    title: 'Catalogo',
    items: [
      { href: '/dashboard/purchases', label: 'Lotti', icon: Receipt },
      { href: '/dashboard/inventory', label: 'Magazzino', icon: Package },
      { href: '/dashboard/listings', label: 'Listino', icon: Tags },
      { href: '/dashboard/categorie', label: 'Categorie', icon: Tag },
      { href: '/dashboard/espansioni', label: 'Espansioni', icon: Layers },
    ],
  },
  {
    title: 'Comunicazione',
    items: [{ href: '/dashboard/messages', label: 'Messaggi', icon: MessageSquare }],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/dashboard/impostazioni', label: 'Impostazioni', icon: Settings },
    ],
  },
]

function navGroups(sqlEnabled: boolean): { title: string; items: NavItem[] }[] {
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: [...g.items] }))
  if (sqlEnabled) {
    const sistema = groups.find((g) => g.title === 'Sistema')
    sistema?.items.push({ href: '/dashboard/sql', label: 'SQL', icon: Terminal })
  }
  return groups
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

export function DashboardShell({ children, sqlEnabled }: { children: React.ReactNode; sqlEnabled: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const groups = navGroups(sqlEnabled)

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--ui-border)] px-5 py-5">
        <Link href="/dashboard" onClick={() => setOpen(false)} className="block">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ui-text-faint)]">Area Riservata</p>
          <p className="text-xl font-bold text-[var(--ui-text)]">
            Dark<span className="text-[var(--ui-accent)]">CMS</span>
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent-hover)]'
                          : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-alt)] hover:text-[var(--ui-text)]'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--ui-border)] p-3">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-danger-soft)] hover:text-[var(--ui-danger)]"
        >
          <LogOut className="h-4 w-4" /> Esci
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--ui-bg)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[var(--ui-border)] bg-[var(--ui-bg)] lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-[var(--ui-border)] bg-[var(--ui-bg)]">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/90 px-4 py-3 backdrop-blur lg:hidden">
          <p className="text-sm font-bold text-[var(--ui-text)]">
            Dark<span className="text-[var(--ui-accent)]">CMS</span>
          </p>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Apri menu"
            className="rounded-md border border-[var(--ui-border-strong)] p-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
