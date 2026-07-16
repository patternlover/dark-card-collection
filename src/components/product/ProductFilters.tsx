'use client'

interface Filter {
  id: string
  label: string
}

interface ProductFiltersProps {
  filters: Filter[]
  selected: string
  onChange: (id: string) => void
}

export function ProductFilters({ filters, selected, onChange }: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selected === filter.id
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
