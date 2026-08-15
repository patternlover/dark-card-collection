import { useState } from 'react'
import type { SortDir } from '@/lib/listings'

export function useSort(initialBy = 'title') {
  const [sortBy, setSortBy] = useState(initialBy)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

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
