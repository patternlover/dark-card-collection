import { describe, it, expect } from 'vitest'
import { computeFilterCounts } from '@/lib/product-filters'

const base = {
  status: 'listed',
  is_visible: true,
  item_category_3: 'box',
  collection: { id: 10, name: 'Prima Serie' },
  slug: 'slug',
}

describe('computeFilterCounts', () => {
  it('counts each single product (unique title) once, not per variant', () => {
    const counts = computeFilterCounts([
      { ...base, title: 'Booster Box', grade: 'mint', language: 'italian' },
      { ...base, title: 'Booster Box', grade: 'mint', language: 'english' },
      { ...base, title: 'ETB', grade: 'mint', language: 'italian' },
    ])
    expect(counts.cond['mint']).toBe(2)
    expect(counts.lang['italian']).toBe(2)
    expect(counts.lang['english']).toBe(1)
  })

  it('counts a title even when the first variant lacks an attribute', () => {
    const counts = computeFilterCounts([
      { ...base, title: 'Box', grade: 'near-mint', language: 'italian' },
      { ...base, title: 'Box', grade: 'mint', language: 'english' },
    ])
    expect(counts.cond['mint']).toBe(1)
    expect(counts.cond['near-mint']).toBe(1)
  })

  it('counts micro prodotti and espansioni per unique title', () => {
    const counts = computeFilterCounts([
      { ...base, title: 'Box', item_category_3: 'box', item_category_2: { id: 10, name: 'Prima Serie' } },
      { ...base, title: 'Box', item_category_3: 'box', item_category_2: { id: 10, name: 'Prima Serie' } },
      { ...base, title: 'ETB', item_category_3: 'etb', item_category_2: { id: 10, name: 'Prima Serie' } },
    ])
    expect(counts.micro['box']).toBe(1)
    expect(counts.micro['etb']).toBe(1)
    expect(counts.col['10']).toBe(2)
  })

  it('uses Untitled as fallback key for missing titles', () => {
    const counts = computeFilterCounts([
      { ...base, title: undefined, grade: 'mint' },
      { ...base, title: undefined, grade: 'mint' },
    ])
    expect(counts.cond['mint']).toBe(1)
  })
})
