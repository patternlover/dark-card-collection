import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import type { SortDir } from '@/lib/listings'
import { Th } from './Table'

export function SortableTh({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  className = '',
}: {
  label: string
  field: string
  sortBy: string
  sortDir: SortDir
  onSort: (field: string) => void
  className?: string
}) {
  const active = sortBy === field
  return (
    <Th className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wide text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-[var(--ui-text-faint)]" />
        )}
      </button>
    </Th>
  )
}
