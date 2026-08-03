export interface ListingParams {
  q?: string
  category?: string
  collection?: string
  condition?: string
  language?: string
}

export function applyListingFilters(where: any, params: ListingParams): any {
  const next = { ...where }
  if (params.category) {
    next.category = { equals: Number(params.category) || params.category }
  }
  if (params.collection) {
    next.collection = { equals: Number(params.collection) || params.collection }
  }
  if (params.condition) {
    next.condition = { equals: params.condition }
  }
  if (params.language) {
    next.language = { equals: params.language }
  }
  if (params.q) {
    next.title = { contains: params.q }
  }
  return next
}

export function hasActiveFilters(params: ListingParams): boolean {
  return Boolean(params.q || params.category || params.collection || params.condition || params.language)
}

export const CONDITION_OPTIONS = [
  { value: 'mint', label: 'Sigillato' },
  { value: 'near-mint', label: 'Near Mint' },
  { value: 'graded', label: 'Graded' },
]

export const LANGUAGE_OPTIONS = [
  { value: 'italian', label: 'Italiano' },
  { value: 'english', label: 'Inglese' },
  { value: 'chinese', label: 'Cinese' },
]
