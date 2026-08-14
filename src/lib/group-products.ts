import { getProductImageInfo } from './product-image'

export interface ProductGroup {
  title: string
  products: any[]
  sellingPrice: number
  totalQuantity: number
  image: string | null
  imageCard: string | null
  imagePdp: string | null
  variantCount: number
  itemCategory2: any
  slug: string
  itemCategory1: string
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
      return (a.price || Infinity) - (b.price || Infinity)
    })

    const prices = sorted
      .map((p: any) => p.price)
      .filter((p: any) => p != null && p > 0)

    const sellingPrice = prices.length > 0 ? Math.min(...prices) : 0
    const totalQuantity = sorted.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)

    const firstWithImage = sorted.find(
      (p: any) =>
        p.images?.[0]?.image?.url ||
        (typeof p.image === 'object' && p.image?.url) ||
        p.image_link,
    )
    const imageInfo = getProductImageInfo(firstWithImage || {})

    groups.push({
      title,
      products: sorted,
      sellingPrice,
      totalQuantity,
      image: imageInfo.url,
      imageCard: imageInfo.cardUrl,
      imagePdp: imageInfo.pdpUrl,
      variantCount: sorted.length,
      itemCategory2: sorted[0]?.item_category_2 || null,
      slug: sorted[0]?.slug || '',
      itemCategory1: sorted[0]?.item_category_1 || 'product',
    })
  }

  groups.sort((a, b) => a.title.localeCompare(b.title))
  return groups
}
