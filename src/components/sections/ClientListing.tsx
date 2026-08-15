'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, ChevronDown, Search } from 'lucide-react'
import { ProductCard } from '@/components/product/ProductCard'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { groupProducts } from '@/lib/group-products'
import { GRADE_OPTIONS, LANGUAGE_OPTIONS, computeFilterCounts } from '@/lib/product-filters'
import { trackFilter } from '@/lib/analytics'

interface ClientListingProps {
  products: any[]
  categories?: any[]
  espansioni?: any[]
  basePath: string
  emptyTitle?: string
  emptySubtitle?: string
  title?: string
  subtitle?: string
}

interface Filters {
  q: string
  micro: string
  expansion: string
  grade: string
  language: string
}

const EMPTY_FILTERS: Filters = { q: '', micro: '', expansion: '', grade: '', language: '' }

const selectClass =
  'w-full appearance-none border-2 border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-9 text-sm text-white focus:border-[var(--accent)] focus:outline-none shadow-[2px_2px_0px_0px_#27272a] disabled:opacity-40 disabled:cursor-not-allowed'

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cerca per nome..."
        className="w-full border-2 border-zinc-700 bg-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 shadow-[3px_3px_0px_0px_#27272a] focus:border-[var(--accent)] focus:outline-none"
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  counts,
  allLabel,
  current,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  counts: Record<string, number>
  allLabel: string
  current: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClass}
        >
          <option value="">{allLabel}</option>
          {options.map((opt) => {
            const count = counts[opt.value] || 0
            const selected = current === opt.value
            return (
              <option key={opt.value} value={opt.value} disabled={!selected && count === 0}>
                {opt.label}
                {count > 0 ? ` (${count})` : ''}
              </option>
            )
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </span>
    </label>
  )
}

export function ClientListing({
  products,
  categories = [],
  espansioni = [],
  basePath,
  emptyTitle = 'Nessun prodotto trovato.',
  emptySubtitle = 'Prova a modificare i filtri di ricerca.',
  title,
  subtitle,
}: ClientListingProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(() => ({
    q: searchParams.get('q') || '',
    micro: searchParams.get('micro') || '',
    expansion: searchParams.get('collection') || '',
    grade: searchParams.get('grade') || '',
    language: searchParams.get('language') || '',
  }))

  const buildUrl = useCallback(
    (next: Filters) => {
      const sp = new URLSearchParams()
      if (next.q) sp.set('q', next.q)
      if (next.micro) sp.set('micro', next.micro)
      if (next.expansion) sp.set('collection', next.expansion)
      if (next.grade) sp.set('grade', next.grade)
      if (next.language) sp.set('language', next.language)
      const qs = sp.toString()
      return qs ? `${basePath}?${qs}` : basePath
    },
    [basePath],
  )

  const updateFilters = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch }
        router.replace(buildUrl(next), { scroll: false })
        return next
      })
    },
    [router, buildUrl],
  )

  const handleSelect = (key: 'micro' | 'expansion' | 'grade' | 'language', value: string) => {
    trackFilter(key, value)
    updateFilters({ [key]: value })
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    router.replace(basePath, { scroll: false })
  }

  const active = Boolean(
    filters.q || filters.micro || filters.expansion || filters.grade || filters.language,
  )

  const counts = useMemo(() => computeFilterCounts(products), [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filters.q && !String(p.title || '').toLowerCase().includes(filters.q.toLowerCase())) {
        return false
      }
      if (filters.micro && String(p.item_category_3?.id) !== filters.micro) return false
      if (filters.expansion && String(p.item_category_2?.id) !== filters.expansion) return false
      if (filters.grade && p.grade !== filters.grade) return false
      if (filters.language && p.language !== filters.language) return false
      return true
    })
  }, [products, filters])

  const groups = useMemo(() => groupProducts(filtered), [filtered])
  const resultCount = groups.length

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [{ label: 'Home', href: '/' }]
    if (basePath === '/shop') {
      crumbs.push({ label: 'Shop' })
    } else if (basePath === '/shop/bestsellers') {
      crumbs.push({ label: 'Shop', href: '/shop' }, { label: 'Bestseller' })
    } else if (basePath === '/shop/new-arrivals') {
      crumbs.push({ label: 'Shop', href: '/shop' }, { label: 'Novità' })
    } else if (basePath === '/shop/preorders') {
      crumbs.push({ label: 'Shop', href: '/shop' }, { label: 'In Attesa' })
    }
    return crumbs
  }, [basePath])

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
      <div className="hidden lg:block" aria-hidden="true" />

      <div className="min-w-0">
        <Breadcrumb className="mb-4" items={breadcrumbs} />

        {title && (
          <Reveal>
            <div className="mb-6">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
            </div>
          </Reveal>
        )}

        <div className="mb-6">
          <SearchInput value={filters.q} onChange={(v) => updateFilters({ q: v })} />
        </div>

        <p className="mb-6 text-xs text-zinc-500">
          {resultCount === 1 ? '1 prodotto' : `${resultCount} prodotti`}
          {active ? ' trovati' : ' disponibili'}
        </p>
      </div>

      <aside className="mb-6 border-2 border-zinc-700 bg-zinc-900 shadow-[3px_3px_0px_0px_#27272a] lg:sticky lg:top-28 lg:mb-0 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:p-5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-5 py-4 lg:hidden"
        >
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--accent)]">
            <SlidersHorizontal className="h-4 w-4" />
            Filtri
          </span>
          <span className="flex items-center gap-3">
            {active && <span className="text-xs text-zinc-400">Filtri attivi</span>}
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <div className={`space-y-4 border-t-2 border-zinc-700 p-5 lg:block lg:border-t-0 lg:p-0 ${open ? 'block' : 'hidden'}`}>
          <div className="hidden items-center justify-between lg:flex">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--accent)]">
              <SlidersHorizontal className="h-4 w-4" />
              Filtri
            </h2>
            {active && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-zinc-400 underline underline-offset-2 hover:text-white"
              >
                Azzera
              </button>
            )}
          </div>

          <FilterSelect
            label="Grado"
            value={filters.grade}
            onChange={(v) => handleSelect('grade', v)}
            options={GRADE_OPTIONS}
            counts={counts.cond}
            allLabel="Tutti i gradi"
            current={filters.grade}
          />

          <FilterSelect
            label="Lingua"
            value={filters.language}
            onChange={(v) => handleSelect('language', v)}
            options={LANGUAGE_OPTIONS}
            counts={counts.lang}
            allLabel="Tutte le lingue"
            current={filters.language}
          />

          {categories.length > 0 && (
            <FilterSelect
              label="Micro prodotto"
              value={filters.micro}
              onChange={(v) => handleSelect('micro', v)}
              options={categories.map((c: any) => ({ value: String(c.id), label: c.name }))}
              counts={counts.micro}
              allLabel="Tutti i micro prodotti"
              current={filters.micro}
            />
          )}

          {espansioni.length > 0 && (
            <FilterSelect
              label="Espansione"
              value={filters.expansion}
              onChange={(v) => handleSelect('expansion', v)}
              options={espansioni.map((col: any) => ({ value: String(col.id), label: col.name }))}
              counts={counts.col}
              allLabel="Tutte le espansioni"
              current={filters.expansion}
            />
          )}

          <button
            type="button"
            onClick={resetFilters}
            tabIndex={active ? 0 : -1}
            aria-hidden={!active}
            className={`w-full border-2 border-zinc-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white lg:hidden ${
              active ? 'visible' : 'invisible'
            }`}
          >
            Azzera filtri
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {resultCount === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-zinc-500">{emptyTitle}</p>
            <p className="mt-2 text-sm text-zinc-600">{emptySubtitle}</p>
          </div>
        ) : (
          <Reveal>
            <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
              {groups.map((group) => (
                <div key={group.title} className="mb-6 break-inside-avoid">
                  <ProductCard group={group} />
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}
