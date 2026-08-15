import { describe, it, expect } from 'vitest'
import type { ProductDTO } from '@/app/dashboard/actions'
import {
  buildListingGroups,
  countFeaturedGroups,
  filterListingGroups,
  deriveAvailability,
  flattenListingItems,
  sortListingGroups,
  sortListingItems,
  type ListingSale,
} from '@/lib/listings'

function product(over: Partial<ProductDTO> & { id: string | number; title: string }): ProductDTO {
  return {
    id: over.id,
    title: over.title,
    slug: 'slug',
    itemGroupId: null,
    description: null,
    price: over.price ?? null,
    salePrice: over.salePrice ?? null,
    costOfGoodsSold: over.costOfGoodsSold ?? null,
    availability: over.availability ?? 'in_stock',
    grade: over.grade ?? null,
    condition: over.condition ?? null,
    productType: null,
    googleProductCategory: null,
    itemCategory2: null,
    language: over.language ?? 'italian',
    cardNumber: null,
    rarity: null,
    quantity: over.quantity ?? 1,
    imageLink: null,
    images: null,
    averageSalePrice: null,
    lastPriceUpdate: null,
    featured: over.featured ?? false,
    isVisible: over.isVisible ?? true,
    createdAt: null,
    updatedAt: null,
  }
}

const sales: ListingSale[] = [
  { productId: 1, channel: 'website', quantity: 2, value: 100, createdAt: '2026-01-10T10:00:00Z' },
  { productId: 1, channel: 'vinted', quantity: 1, value: 40, createdAt: '2026-01-15T10:00:00Z' },
  { productId: 2, channel: 'vinted', quantity: 1, value: 45, createdAt: '2026-01-20T10:00:00Z' },
]

describe('deriveAvailability', () => {
  it('returns out_of_stock when quantity is 0', () => {
    expect(deriveAvailability(0, 'in_stock')).toBe('out_of_stock')
  })
  it('returns in_stock when quantity > 0', () => {
    expect(deriveAvailability(3, 'in_stock')).toBe('in_stock')
  })
  it('keeps preorder for positive stock preorders', () => {
    expect(deriveAvailability(3, 'preorder')).toBe('preorder')
  })
})

describe('buildListingGroups', () => {
  it('groups variants by title', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Collezione A', quantity: 2, price: 50 }),
        product({ id: '2', title: 'Collezione B', quantity: 1, price: 30 }),
        product({ id: '3', title: 'Collezione A', quantity: 1, price: 48 }),
      ],
      [],
    )
    expect(groups).toHaveLength(2)
    const g = groups.find((x) => x.title === 'Collezione A')!
    expect(g.variantCount).toBe(2)
    expect(g.totalQuantity).toBe(3)
    expect(g.price).toBe(48)
  })

  it('group is out of stock when total quantity is 0', () => {
    const groups = buildListingGroups([product({ id: '1', title: 'Box', quantity: 0 })], [])
    expect(groups[0]!.availability).toBe('out_of_stock')
  })

  it('computes weighted average cost across variants', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box', quantity: 3, costOfGoodsSold: 10 }),
        product({ id: '2', title: 'Box', quantity: 1, costOfGoodsSold: 14 }),
      ],
      [],
    )
    expect(groups[0]!.cost).toBe(11)
  })

  it('falls back to plain average cost when all quantities are 0', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box', quantity: 0, costOfGoodsSold: 10 }),
        product({ id: '2', title: 'Box', quantity: 0, costOfGoodsSold: 14 }),
      ],
      [],
    )
    expect(groups[0]!.cost).toBe(12)
  })

  it('cost is null when no variant has a cost', () => {
    const groups = buildListingGroups([product({ id: '1', title: 'Box', costOfGoodsSold: null })], [])
    expect(groups[0]!.cost).toBeNull()
  })

  it('aggregates sold quantity and per-channel summaries', () => {
    const groups = buildListingGroups([product({ id: '1', title: 'Box', quantity: 5 })], sales)
    const g = groups[0]!
    expect(g.totalSold).toBe(3)
    const v = g.variants[0]!
    expect(v.soldQuantity).toBe(3)
    expect(v.saleSummaries).toHaveLength(2)
    const website = v.saleSummaries.find((s) => s.channel === 'website')!
    expect(website.quantity).toBe(2)
    expect(website.value).toBe(100)
    const vinted = v.saleSummaries.find((s) => s.channel === 'vinted')!
    expect(vinted.quantity).toBe(1)
  })

  it('derives group visibility: hidden only when all variants hidden', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box', isVisible: true }),
        product({ id: '2', title: 'Box', isVisible: false }),
      ],
      [],
    )
    const g = groups[0]!
    expect(g.visible).toBe(true)
    expect(g.hidden).toBe(false)

    const hidden = buildListingGroups(
      [product({ id: '3', title: 'Old', isVisible: false }), product({ id: '4', title: 'Old', isVisible: false })],
      [],
    )
    expect(hidden[0]!.visible).toBe(false)
    expect(hidden[0]!.hidden).toBe(true)
  })

  it('derives group featured from any variant', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box', featured: false }),
        product({ id: '2', title: 'Box', featured: true }),
      ],
      [],
    )
    expect(groups[0]!.featured).toBe(true)
  })
})

describe('flattenListingItems', () => {
  it('flattens all variants across groups', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box A', quantity: 2 }),
        product({ id: '2', title: 'Box B', quantity: 1 }),
        product({ id: '3', title: 'Box A', quantity: 1 }),
      ],
      [],
    )
    const items = flattenListingItems(groups)
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.id)).toEqual(['1', '3', '2'])
  })

  it('keeps per-item detail (status, availability, sold)', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box', quantity: 0 }),
        product({ id: '2', title: 'Box', quantity: 3 }),
      ],
      [{ productId: 1, channel: 'vinted', quantity: 1, value: 40, createdAt: '2026-01-15T10:00:00Z' }],
    )
    const items = flattenListingItems(groups)
    const sold = items.find((i) => i.id === '1')!
    expect(sold.availability).toBe('out_of_stock')
    expect(sold.soldQuantity).toBe(1)
    const listed = items.find((i) => i.id === '2')!
    expect(listed.availability).toBe('in_stock')
  })
})

describe('countFeaturedGroups', () => {
  it('counts groups with at least one featured variant', () => {
    const groups = buildListingGroups(
      [
        product({ id: '1', title: 'Box A', featured: true }),
        product({ id: '2', title: 'Box B', featured: false }),
        product({ id: '3', title: 'Box C', featured: false }),
        product({ id: '4', title: 'Box C', featured: true }),
      ],
      [],
    )
    expect(countFeaturedGroups(groups)).toBe(2)
  })
})

describe('sortListingGroups', () => {
  const groups = buildListingGroups(
    [
      product({ id: '1', title: 'Box B', quantity: 3, price: 30, featured: true }),
      product({ id: '2', title: 'Box A', quantity: 5, price: 10 }),
      product({ id: '3', title: 'Box C', quantity: 1, price: 20 }),
    ],
    [],
  )

  it('sorts by title asc/desc', () => {
    expect(sortListingGroups(groups, { by: 'title', dir: 'asc' }).map((g) => g.title)).toEqual(['Box A', 'Box B', 'Box C'])
    expect(sortListingGroups(groups, { by: 'title', dir: 'desc' }).map((g) => g.title)).toEqual(['Box C', 'Box B', 'Box A'])
  })

  it('sorts by quantity numerically', () => {
    expect(sortListingGroups(groups, { by: 'quantity', dir: 'asc' }).map((g) => g.title)).toEqual(['Box C', 'Box B', 'Box A'])
    expect(sortListingGroups(groups, { by: 'quantity', dir: 'desc' }).map((g) => g.title)).toEqual(['Box A', 'Box B', 'Box C'])
  })

  it('sorts by price, keeping nulls last', () => {
    const withNull = buildListingGroups(
      [
        product({ id: '1', title: 'B', price: 20 }),
        product({ id: '2', title: 'A', price: null }),
        product({ id: '3', title: 'C', price: 10 }),
      ],
      [],
    )
    expect(sortListingGroups(withNull, { by: 'price', dir: 'asc' }).map((g) => g.title)).toEqual(['C', 'B', 'A'])
  })

  it('returns a new array without mutating the input', () => {
    const sorted = sortListingGroups(groups, { by: 'price', dir: 'desc' })
    expect(sorted).not.toBe(groups)
    expect(groups.map((g) => g.title)).toEqual(['Box A', 'Box B', 'Box C'])
  })
})

describe('sortListingItems', () => {
  const items = flattenListingItems(
    buildListingGroups(
      [
        product({ id: '1', title: 'Box B', quantity: 3 }),
        product({ id: '2', title: 'Box A', quantity: 5 }),
        product({ id: '3', title: 'Box C', quantity: 1 }),
      ],
      [],
    ),
  )

  it('sorts by quantity desc', () => {
    expect(sortListingItems(items, { by: 'quantity', dir: 'desc' }).map((i) => i.id)).toEqual(['2', '1', '3'])
  })
})

describe('filterListingGroups', () => {
  const groups = buildListingGroups(
    [
      product({ id: '1', title: 'Collezione A', quantity: 2, featured: true }),
      product({ id: '2', title: 'Collezione B', quantity: 0, featured: false }),
      product({ id: '3', title: 'Collezione C', quantity: 1, isVisible: false, featured: false }),
    ],
    sales,
  )

  it('filters by in stock / out of stock', () => {
    expect(filterListingGroups(groups, { availability: 'in_stock' }).map((g) => g.title)).toEqual([
      'Collezione A',
      'Collezione C',
    ])
    expect(filterListingGroups(groups, { availability: 'out_of_stock' }).map((g) => g.title)).toEqual(['Collezione B'])
  })

  it('filters by sales channel', () => {
    expect(filterListingGroups(groups, { channel: 'website' }).map((g) => g.title)).toEqual(['Collezione A'])
    expect(filterListingGroups(groups, { channel: 'vinted' }).map((g) => g.title)).toEqual(['Collezione A', 'Collezione B'])
    expect(filterListingGroups(groups, { channel: 'ebay' })).toEqual([])
  })

  it('filters by visibility', () => {
    expect(filterListingGroups(groups, { visibility: 'hidden' }).map((g) => g.title)).toEqual(['Collezione C'])
    expect(filterListingGroups(groups, { visibility: 'visible' }).map((g) => g.title)).toEqual([
      'Collezione A',
      'Collezione B',
    ])
  })

  it('filters by featured', () => {
    expect(filterListingGroups(groups, { featured: 'featured' }).map((g) => g.title)).toEqual(['Collezione A'])
  })

  it('filters by search', () => {
    expect(filterListingGroups(groups, { search: 'collezione b' }).map((g) => g.title)).toEqual(['Collezione B'])
  })
})
