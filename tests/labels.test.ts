import { describe, it, expect } from 'vitest'
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  SALES_CHANNEL_LABELS,
  GRADE_OPTIONS,
  CONDITION_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@/lib/labels'

describe('labels', () => {
  it('STATUS_LABELS covers all statuses', () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(
      ['pending', 'paid', 'shipped', 'cancelled'].sort(),
    )
  })

  it('STATUS_OPTIONS derives from STATUS_LABELS', () => {
    expect(STATUS_OPTIONS).toEqual(
      Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    )
  })

  it('SALES_CHANNEL_LABELS covers website + platforms', () => {
    expect(SALES_CHANNEL_LABELS.website).toBe('Sito web')
    expect(SALES_CHANNEL_LABELS.vinted).toBe('Vinted')
    expect(SALES_CHANNEL_LABELS.ebay).toBe('eBay')
    expect(SALES_CHANNEL_LABELS.cardmarket).toBe('Cardmarket')
    expect(SALES_CHANNEL_LABELS.other).toBe('Altro')
  })

  it('GRADE_OPTIONS has a unique set of values', () => {
    const values = GRADE_OPTIONS.map((o) => o.value)
    expect(new Set(values).size).toBe(values.length)
    expect(values).toContain('mint')
    expect(values).toContain('graded')
  })

  it('CONDITION_OPTIONS covers used/new/refurbished', () => {
    expect(CONDITION_OPTIONS.map((o) => o.value).sort()).toEqual(
      ['new', 'refurbished', 'used'].sort(),
    )
  })

  it('LANGUAGE_OPTIONS covers the 4 languages', () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.value).sort()).toEqual(
      ['chinese', 'english', 'italian', 'japanese'].sort(),
    )
  })
})
