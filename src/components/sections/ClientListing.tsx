'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, ChevronDown, Search } from 'lucide-react'
import { ProductGroupCard } from '@/components/product/ProductGroupCard'
import { ProductCard } from '@/components/product/ProductCard'
import { Reveal } from '@/components/ui/Reveal'
import { groupProducts } from '@/lib/group-products'
import { CONDITION_OPTIONS, LANGUAGE_OPTIONS } from '@/lib/product-filters'
import { trackFilter } from '@/lib/analytics'

interface ClientListingProps {
  products: any[]
  categories?: any[]
  collections?: any[]
  basePath: string
  grouped?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  title?: string
  subtitle?: string
}

interface Filters {
  q: string
  category: string
  collection: string
  condition: string
  language: string
}

const EMPTY_FILTERS: Filters = { q: '', category: '', collection: '', condition: '', language: '' }

const selectClass =
  'w-full border-2 border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-[var(--accent)] focus:outline-none shadow-[2px_2px_0px_0px_#27272a] disabled:opacity-40 disabled:cursor-not-allowed'

export function ClientListing({
  products,
  categories = [],
  collections = [],
  basePath,
  grouped = true,
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
    category: searchParams.get('category') || '',
    collection: searchParams.get('collection') || '',
    condition: searchParams.get('condition') || '',
    language: searchParams.get('language') || '',
  }))

  const buildUrl = useCallback(
    (next: Filters) => {
      const sp = new URLSearchParams()
      if (next.q) sp.set('q', next.q)
      if (next.category) sp.set('category', next.category)
      if (next.collection) sp.set('collection', next.collection)
      if (next.condition) sp.set('condition', next.condition)
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

  const handleSelect = (key: 'category' | 'collection' | 'condition' | 'language', value: string) => {
    trackFilter(key, value)
    updateFilters({ [key]: value })
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    router.replace(basePath, { scroll: false })
  }

  const active = Boolean(
    filters.q || filters.category || filters.collection || filters.condition || filters.language,
  )

  const counts = useMemo(() => {
    const cond: Record<string, number> = {}
    const lang: Record<string, number> = {}
    const cat: Record<string, number> = {}
    const col: Record<string, number> = {}
    for (const p of products) {
      if (p.condition) cond[p.condition] = (cond[p.condition] || 0) + 1
      if (p.language) lang[p.language] = (lang[p.language] || 0) + 1
      const cid = p.category?.id
      if (cid != null) cat[String(cid)] = (cat[String(cid)] || 0) + 1
      const colid = p.collection?.id
      if (colid != null) col[String(colid)] = (col[String(colid)] || 0) + 1
    }
    return { cond, lang, cat, col }
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filters.q && !String(p.title || '').toLowerCase().includes(filters.q.toLowerCase())) {
        return false
      }
      if (filters.category && String(p.category?.id) !== filters.category) return false
      if (filters.collection && String(p.collection?.id) !== filters.collection) return false
      if (filters.condition && p.condition !== filters.condition) return false
      if (filters.language && p.language !== filters.language) return false
      return true
    })
  }, [products, filters])

  const unique = useMemo(() => {
    const seen = new Map<string, any>()
    for (const p of filtered) {
      const key = p.title || 'Untitled'
      if (!seen.has(key)) seen.set(key, p)
    }
    return [...seen.values()]
  }, [filtered])

  const groups = useMemo(() => (grouped ? groupProducts(filtered) : []), [grouped, filtered])
  const resultCount = grouped ? groups.length : unique.length

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Condizione
            </span>
            <select
              value={filters.condition}
              onChange={(e) => handleSelect('condition', e.target.value)}
              className={selectClass}
            >
              <option value="">Tutte le condizioni</option>
              {CONDITION_OPTIONS.map((opt) => {
                const count = counts.cond[opt.value] || 0
                const selected = filters.condition === opt.value
                return (
                  <option key={opt.value} value={opt.value} disabled={!selected && count === 0}>
                    {opt.label}
                    {count > 0 ? ` (${count})` : ''}
                  </option>
                )
              })}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Lingua
            </span>
            <select
              value={filters.language}
              onChange={(e) => handleSelect('language', e.target.value)}
              className={selectClass}
            >
              <option value="">Tutte le lingue</option>
              {LANGUAGE_OPTIONS.map((opt) => {
                const count = counts.lang[opt.value] || 0
                const selected = filters.language === opt.value
                return (
                  <option key={opt.value} value={opt.value} disabled={!selected && count === 0}>
                    {opt.label}
                    {count > 0 ? ` (${count})` : ''}
                  </option>
                )
              })}
            </select>
          </label>

          {categories.length > 0 && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Categoria
              </span>
              <select
                value={filters.category}
                onChange={(e) => handleSelect('category', e.target.value)}
                className={selectClass}
              >
                <option value="">Tutte le categorie</option>
                {categories.map((cat: any) => {
                  const count = counts.cat[String(cat.id)] || 0
                  const selected = filters.category === String(cat.id)
                  return (
                    <option key={cat.id} value={String(cat.id)} disabled={!selected && count === 0}>
                      {cat.name}
                      {count > 0 ? ` (${count})` : ''}
                    </option>
                  )
                })}
              </select>
            </label>
          )}

          {collections.length > 0 && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Collezione
              </span>
              <select
                value={filters.collection}
                onChange={(e) => handleSelect('collection', e.target.value)}
                className={selectClass}
              >
                <option value="">Tutte le collezioni</option>
                {collections.map((col: any) => {
                  const count = counts.col[String(col.id)] || 0
                  const selected = filters.collection === String(col.id)
                  return (
                    <option key={col.id} value={String(col.id)} disabled={!selected && count === 0}>
                      {col.name}
                      {count > 0 ? ` (${count})` : ''}
                    </option>
                  )
                })}
              </select>
            </label>
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
        {title && (
          <Reveal>
            <div className="mb-6 lg:mb-8">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
            </div>
          </Reveal>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => updateFilters({ q: e.target.value })}
              placeholder="Cerca per nome..."
              className="w-full border-2 border-zinc-700 bg-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 shadow-[3px_3px_0px_0px_#27272a] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>

        <p className="mb-4 text-xs text-zinc-500">
          {resultCount === 1 ? '1 prodotto' : `${resultCount} prodotti`}
          {active ? ' trovati' : ' disponibili'}
        </p>

        {resultCount === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-zinc-500">{emptyTitle}</p>
            <p className="mt-2 text-sm text-zinc-600">{emptySubtitle}</p>
          </div>
        ) : grouped ? (
          <Reveal>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <ProductGroupCard key={group.title} group={group} />
              ))}
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {unique.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}
