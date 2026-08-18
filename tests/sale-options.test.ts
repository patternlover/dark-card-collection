import { describe, it, expect } from 'vitest'
import { buildSaleOptions, buildVariantOptions, type SaleProductOption } from '@/lib/sale-options'

const base = { quantity: 1, price: 10, language: 'italian' } as const

describe('buildSaleOptions', () => {
  it('renders a single product as a plain option with stock', () => {
    const entries = buildSaleOptions([{ id: '1', title: 'Collezione Serie 2', ...base, quantity: 3 }])
    expect(entries).toEqual([
      { kind: 'option', value: '1', label: 'Collezione Serie 2 (stock 3)' },
    ])
  })

  it('groups variants under an optgroup labelled by the differing attribute', () => {
    const entries = buildSaleOptions([
      { id: '1', title: 'Charizard 9', ...base, grade: 'excellent' },
      { id: '2', title: 'Charizard 9', ...base, grade: 'near-mint' },
    ])
    expect(entries).toHaveLength(1)
    const group = entries[0]
    expect(group.kind).toBe('optgroup')
    if (group.kind === 'optgroup') {
      expect(group.label).toBe('Charizard 9')
      expect(group.options).toEqual([
        { value: '1', label: 'Charizard 9 · Excellent (stock 1)' },
        { value: '2', label: 'Charizard 9 · Near Mint (stock 1)' },
      ])
    }
  })

  it('falls back to condition when grade does not differ', () => {
    const entries = buildSaleOptions([
      { id: '1', title: 'Carta', ...base, grade: 'near-mint', condition: 'new' },
      { id: '2', title: 'Carta', ...base, grade: 'near-mint', condition: 'used' },
    ])
    const group = entries[0]
    if (group.kind === 'optgroup') {
      expect(group.options.map((o) => o.label)).toEqual([
        'Carta · Nuovo (stock 1)',
        'Carta · Usato (stock 1)',
      ])
    }
  })

  it('falls back to language when grade and condition are equal', () => {
    const entries = buildSaleOptions([
      { id: '1', title: 'Scatola', ...base, language: 'italian' },
      { id: '2', title: 'Scatola', ...base, language: 'english' },
    ])
    const group = entries[0]
    if (group.kind === 'optgroup') {
      expect(group.options.map((o) => o.label)).toEqual([
        'Scatola · Italiano (stock 1)',
        'Scatola · Inglese (stock 1)',
      ])
    }
  })

  it('sorts variants by language then price', () => {
    const entries = buildSaleOptions([
      { id: '1', title: 'Box', ...base, language: 'japanese', price: 100 },
      { id: '2', title: 'Box', ...base, language: 'english', price: 120 },
      { id: '3', title: 'Box', ...base, language: 'english', price: 90 },
    ])
    const group = entries[0]
    if (group.kind === 'optgroup') {
      expect(group.options.map((o) => o.value)).toEqual(['3', '2', '1'])
    }
  })

  it('sorts groups alphabetically by title', () => {
    const entries = buildSaleOptions([
      { id: '1', title: 'Zetacolo', ...base },
      { id: '2', title: 'Alfata', ...base },
    ])
    expect(entries.map((e) => e.label)).toEqual([
      'Alfata (stock 1)',
      'Zetacolo (stock 1)',
    ])
  })
})

describe('buildVariantOptions', () => {
  it('returns a single option for a single product with stock', () => {
    const options = buildVariantOptions([{ id: '1', title: 'ETB', ...base, quantity: 3 }])
    expect(options).toEqual([{ value: '1', label: 'ETB (stock 3)' }])
  })

  it('labels options by the differing attribute', () => {
    const options = buildVariantOptions([
      { id: '1', title: 'Charizard 9', ...base, grade: 'excellent' },
      { id: '2', title: 'Charizard 9', ...base, grade: 'near-mint', quantity: 2 },
    ])
    expect(options).toEqual([
      { value: '1', label: 'Charizard 9 · Excellent (stock 1)' },
      { value: '2', label: 'Charizard 9 · Near Mint (stock 2)' },
    ])
  })

  it('sorts variants by language then price', () => {
    const options = buildVariantOptions([
      { id: '1', title: 'Box', ...base, language: 'japanese', price: 100 },
      { id: '2', title: 'Box', ...base, language: 'english', price: 120 },
      { id: '3', title: 'Box', ...base, language: 'english', price: 90 },
    ])
    expect(options.map((o) => o.value)).toEqual(['3', '2', '1'])
  })

  it('drops the attribute suffix when variants are identical', () => {
    const options = buildVariantOptions([
      { id: '1', title: 'Sealed', ...base },
      { id: '2', title: 'Sealed', ...base },
    ])
    expect(options.map((o) => o.label)).toEqual(['Sealed (stock 1)', 'Sealed (stock 1)'])
  })
})
