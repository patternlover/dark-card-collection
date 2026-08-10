import { describe, it, expect } from 'vitest'
import { groupProducts } from '@/lib/group-products'

const base = { category: null, collection: null, slug: 'slug', language: 'english' }

describe('groupProducts', () => {
  it('groups variants by title', () => {
    const groups = groupProducts([
      { ...base, title: 'Booster Box', price: 100, quantity: 1 },
      { ...base, title: 'ETB', price: 50, quantity: 2 },
      { ...base, title: 'Booster Box', price: 95, quantity: 1 },
    ])
    expect(groups).toHaveLength(2)
    const bb = groups.find((g) => g.title === 'Booster Box')!
    expect(bb.variantCount).toBe(2)
  })

  it('selling price is the minimum positive price', () => {
    const groups = groupProducts([
      { ...base, title: 'Box', price: 100, quantity: 1 },
      { ...base, title: 'Box', price: 80, quantity: 1 },
    ])
    expect(groups[0]!.sellingPrice).toBe(80)
  })

  it('ignores null/zero prices when computing selling price', () => {
    const groups = groupProducts([
      { ...base, title: 'Box', price: null, quantity: 1 },
      { ...base, title: 'Box', price: 0, quantity: 1 },
    ])
    expect(groups[0]!.sellingPrice).toBe(0)
  })

  it('sums quantities across variants', () => {
    const groups = groupProducts([
      { ...base, title: 'Box', price: 10, quantity: 3 },
      { ...base, title: 'Box', price: 10, quantity: 4 },
    ])
    expect(groups[0]!.totalQuantity).toBe(7)
  })

  it('picks the first image_link', () => {
    const groups = groupProducts([
      { ...base, title: 'Box', price: 10, image_link: null },
      { ...base, title: 'Box', price: 10, image_link: 'img2' },
    ])
    expect(groups[0]!.image).toBe('img2')
  })

  it('sorts groups alphabetically and variants by language then price', () => {
    const groups = groupProducts([
      { ...base, title: 'Zeta', price: 1 },
      { ...base, title: 'Alpha', price: 1 },
      { ...base, title: 'Box', price: 100, language: 'english' },
      { ...base, title: 'Box', price: 90, language: 'italian' },
    ])
    expect(groups.map((g) => g.title)).toEqual(['Alpha', 'Box', 'Zeta'])
    const box = groups.find((g) => g.title === 'Box')!
    expect(box.products[0]!.language).toBe('italian')
  })

  it('uses Untitled for missing title', () => {
    const groups = groupProducts([{ ...base, price: 1 }])
    expect(groups[0]!.title).toBe('Untitled')
  })
})
