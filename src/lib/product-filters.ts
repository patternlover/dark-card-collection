export const GRADE_OPTIONS = [
  { value: 'mint', label: 'Sigillato' },
  { value: 'near-mint', label: 'Near Mint' },
  { value: 'graded', label: 'Graded' },
]

export const LANGUAGE_OPTIONS = [
  { value: 'italian', label: 'Italiano' },
  { value: 'english', label: 'Inglese' },
  { value: 'chinese', label: 'Cinese' },
]

interface FilterCounts {
  cond: Record<string, number>
  lang: Record<string, number>
  cat: Record<string, number>
  col: Record<string, number>
}

function addToSet(map: Map<string, Set<string>>, key: string | undefined | null, title: string) {
  if (key == null) return
  if (!map.has(key)) map.set(key, new Set())
  map.get(key)!.add(title)
}

export function computeFilterCounts(products: any[]): FilterCounts {
  const cond = new Map<string, Set<string>>()
  const lang = new Map<string, Set<string>>()
  const cat = new Map<string, Set<string>>()
  const col = new Map<string, Set<string>>()

  for (const p of products) {
    const title = p.title || 'Untitled'
    addToSet(cond, p.grade, title)
    addToSet(lang, p.language, title)
    const cid = p.category?.id
    if (cid != null) addToSet(cat, String(cid), title)
    const colid = p.collection?.id
    if (colid != null) addToSet(col, String(colid), title)
  }

  const toCounts = (map: Map<string, Set<string>>): Record<string, number> =>
    Object.fromEntries([...map.entries()].map(([key, set]) => [key, set.size]))

  return {
    cond: toCounts(cond),
    lang: toCounts(lang),
    cat: toCounts(cat),
    col: toCounts(col),
  }
}
