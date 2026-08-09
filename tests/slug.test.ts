import { describe, expect, it } from 'vitest'
import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it('lowercases and strips accents', () => {
    expect(slugify('Charizard Ex — Édition')).toBe('charizard-ex-edition')
  })

  it('collapses non-alphanumeric runs into a single dash', () => {
    expect(slugify('A  B!?')).toBe('a-b')
    expect(slugify('Scarlet & Violet')).toBe('scarlet-violet')
  })

  it('strips leading and trailing dashes', () => {
    expect(slugify('- Charizard -')).toBe('charizard')
  })

  it('truncates to 80 characters', () => {
    const long = 'x'.repeat(100)
    expect(slugify(long)).toHaveLength(80)
  })

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('!!!')).toBe('')
  })
})
