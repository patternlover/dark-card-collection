import { describe, it, expect } from 'vitest'
import { computeFilterCounts } from '@/lib/product-filters'

const base = {
  status: 'listed',
  is_visible: true,
  category: { id: 1, name: 'Booster Box' },
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

  it('counts categories and collections per unique title', () => {
    const counts = computeFilterCounts([
      { ...base, title: 'Box', category: { id: 1, name: 'Booster Box' }, collection: { id: 10, name: 'Prima Serie' } },
      { ...base, title: 'Box', category: { id: 1, name: 'Booster Box' }, collection: { id: 10, name: 'Prima Serie' } },
      { ...base, title: 'ETB', category: { id: 2, name: 'ETB' }, collection: { id: 10, name: 'Prima Serie' } },
    ])
    expect(counts.cat['1']).toBe(1)
    expect(counts.cat['2']).toBe(1)
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
