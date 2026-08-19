import { useState } from 'react'
import type { SortDir } from '@/lib/listings'

export function useSort(initialBy = 'title', initialDir: SortDir = 'asc') {
  const [sortBy, setSortBy] = useState(initialBy)
  const [sortDir, setSortDir] = useState<SortDir>(initialDir)

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  return { sortBy, sortDir, handleSort }
}
