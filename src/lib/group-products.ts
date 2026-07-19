export interface ProductGroup {
  title: string
  products: any[]
  minPrice: number
  totalQuantity: number
  image: string | null
  variantCount: number
  category: any
  collection: any
  slug: string
}

const LANG_ORDER: Record<string, number> = {
  italian: 0,
  english: 1,
  chinese: 2,
  japanese: 3,
}

export function groupProducts(products: any[]): ProductGroup[] {
  const map = new Map<string, any[]>()

  for (const p of products) {
    const key = p.title || 'Untitled'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }

  const groups: ProductGroup[] = []

  for (const [title, variants] of map) {
    const sorted = variants.sort((a: any, b: any) => {
      const langA = LANG_ORDER[a.language] ?? 99
      const langB = LANG_ORDER[b.language] ?? 99
      if (langA !== langB) return langA - langB
      return (a.storePrice || Infinity) - (b.storePrice || Infinity)
    })

    const prices = sorted
      .map((p: any) => p.storePrice)
      .filter((p: any) => p != null && p > 0)

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const totalQuantity = sorted.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)

    const firstImage = sorted.find((p: any) => p.imageUrl)?.imageUrl || null

    groups.push({
      title,
      products: sorted,
      minPrice,
      totalQuantity,
      image: firstImage,
      variantCount: sorted.length,
      category: sorted[0]?.category || null,
      collection: sorted[0]?.collection || null,
      slug: sorted[0]?.slug || '',
    })
  }

  groups.sort((a, b) => a.title.localeCompare(b.title))
  return groups
}
