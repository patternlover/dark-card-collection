import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import {
  CONDITION_OPTIONS,
  LANGUAGE_OPTIONS,
  hasActiveFilters,
  type ListingParams,
} from '@/lib/product-filters'

interface ProductFiltersSidebarProps {
  action: string
  categories?: any[]
  collections?: any[]
  params: ListingParams
}

const selectClass =
  'w-full border-2 border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-[#FACC15] focus:outline-none shadow-[2px_2px_0px_0px_#27272a]'

export function ProductFiltersSidebar({ action, categories = [], collections = [], params }: ProductFiltersSidebarProps) {
  const active = hasActiveFilters(params)

  return (
    <aside className="h-fit space-y-4 border-2 border-zinc-700 bg-zinc-900 p-5 shadow-[3px_3px_0px_0px_#27272a] lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#FACC15]">
          <SlidersHorizontal className="h-4 w-4" />
          Filtri
        </h2>
        {active && (
          <Link href={action} className="text-xs text-zinc-400 underline underline-offset-2 hover:text-white">
            Azzera
          </Link>
        )}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Condizione</span>
        <select name="condition" defaultValue={params.condition || ''} className={selectClass}>
          <option value="">Tutte le condizioni</option>
          {CONDITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Lingua</span>
        <select name="language" defaultValue={params.language || ''} className={selectClass}>
          <option value="">Tutte le lingue</option>
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {categories.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Categoria</span>
          <select name="category" defaultValue={params.category || ''} className={selectClass}>
            <option value="">Tutte le categorie</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {collections.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Collezione</span>
          <select name="collection" defaultValue={params.collection || ''} className={selectClass}>
            <option value="">Tutte le collezioni</option>
            {collections.map((col: any) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="submit"
        className="w-full border-2 border-[#FACC15] bg-[#FACC15] px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-0 active:shadow-none"
      >
        Applica filtri
      </button>
    </aside>
  )
}
