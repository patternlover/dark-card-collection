import { useMemo } from 'react'
import { compareForSort, type SortDir } from '@/lib/listings'

export function useSortedList<T extends object>(items: T[], sortBy: string, sortDir: SortDir): T[] {
  return useMemo(() => {
    const sign = sortDir === 'desc' ? -1 : 1
    return [...items].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy]
      const bv = (b as Record<string, unknown>)[sortBy]
      return compareForSort(av, bv) * sign
    })
  }, [items, sortBy, sortDir])
}
