export interface SaleProductOption {
  id: string
  title: string
  quantity: number
  price?: number | null
  grade?: string | null
  condition?: string | null
  language?: string | null
}

export interface SaleOption {
  value: string
  label: string
}

export type SaleSelectEntry =
  | { kind: 'option'; value: string; label: string }
  | { kind: 'optgroup'; label: string; options: SaleOption[] }

const GRADE_LABELS: Record<string, string> = {
  mint: 'Mint',
  'near-mint': 'Near Mint',
  'lightly-played': 'Lightly Played',
  'moderately-played': 'Moderately Played',
  'heavily-played': 'Heavily Played',
  damaged: 'Damaged',
  graded: 'Graded',
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  used: 'Usato',
  refurbished: 'Rigenerato',
}

const LANGUAGE_LABELS: Record<string, string> = {
  italian: 'Italiano',
  english: 'Inglese',
  chinese: 'Cinese',
  japanese: 'Giapponese',
}

const LANG_ORDER: Record<string, number> = {
  italian: 0,
  english: 1,
  chinese: 2,
  japanese: 3,
}

type Discriminator = 'grade' | 'condition' | 'language'

function discriminatorFor(products: SaleProductOption[]): Discriminator | null {
  const grade = new Set(products.map((p) => p.grade ?? ''))
  if (grade.size > 1) return 'grade'
  const condition = new Set(products.map((p) => p.condition ?? ''))
  if (condition.size > 1) return 'condition'
  const language = new Set(products.map((p) => p.language ?? ''))
  if (language.size > 1) return 'language'
  return null
}

function attributeLabel(attr: Discriminator, value?: string | null): string | null {
  if (!value) return null
  const map = attr === 'grade' ? GRADE_LABELS : attr === 'condition' ? CONDITION_LABELS : LANGUAGE_LABELS
  return map[value] ?? value
}

function stockLabel(product: SaleProductOption): string {
  return `(stock ${Number(product.quantity) || 0})`
}

function sortVariants(a: SaleProductOption, b: SaleProductOption): number {
  const langDiff = (LANG_ORDER[a.language ?? ''] ?? 99) - (LANG_ORDER[b.language ?? ''] ?? 99)
  if (langDiff !== 0) return langDiff
  return (a.price ?? Infinity) - (b.price ?? Infinity)
}

export function buildVariantOptions(products: SaleProductOption[]): SaleOption[] {
  const discriminator = discriminatorFor(products)
  const sorted = [...products].sort(sortVariants)
  return sorted.map((p) => {
    const attr = discriminator ? attributeLabel(discriminator, p[discriminator]) : null
    const suffix = attr ? ` · ${attr}` : ''
    return {
      value: p.id,
      label: `${p.title}${suffix} ${stockLabel(p)}`,
    }
  })
}

export function buildSaleOptions(products: SaleProductOption[]): SaleSelectEntry[] {
  const byTitle = new Map<string, SaleProductOption[]>()
  for (const p of products) {
    const key = p.title || 'Untitled'
    const arr = byTitle.get(key) ?? []
    arr.push(p)
    byTitle.set(key, arr)
  }

  const entries: SaleSelectEntry[] = []
  const titles = [...byTitle.keys()].sort((a, b) => a.localeCompare(b))

  for (const title of titles) {
    const group = byTitle.get(title)!
    if (group.length === 1) {
      const p = group[0]
      entries.push({
        kind: 'option',
        value: p.id,
        label: `${title} ${stockLabel(p)}`,
      })
      continue
    }

    const discriminator = discriminatorFor(group)
    const sorted = [...group].sort(sortVariants)

    entries.push({
      kind: 'optgroup',
      label: title,
      options: sorted.map((p) => {
        const attr = discriminator ? attributeLabel(discriminator, p[discriminator]) : null
        const suffix = attr ? ` · ${attr}` : ''
        return {
          value: p.id,
          label: `${title}${suffix} ${stockLabel(p)}`,
        }
      }),
    })
  }

  return entries
}
