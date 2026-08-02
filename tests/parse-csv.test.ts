import { describe, it, expect } from 'vitest'
import { parseCSV } from '@/lib/parse-csv'

describe('parseCSV', () => {
  it('parses basic rows', () => {
    const rows = parseCSV('name,price\nBinder,10\nBox,20\n')
    expect(rows).toEqual([
      { name: 'Binder', price: '10' },
      { name: 'Box', price: '20' },
    ])
  })

  it('handles quoted fields with commas', () => {
    const rows = parseCSV('product,price\n"Booster Box, 36 pack",54.90\n')
    expect(rows[0]!.product).toBe('Booster Box, 36 pack')
  })

  it('handles escaped quotes', () => {
    const rows = parseCSV('note\n"Say ""hello"""\n')
    expect(rows[0]!.note).toBe('Say "hello"')
  })

  it('handles newlines within quotes', () => {
    const rows = parseCSV('note\n"line1\nline2"\n')
    expect(rows[0]!.note).toBe('line1\nline2')
  })

  it('skips empty rows', () => {
    const rows = parseCSV('a,b\n1,2\n\n\n3,4\n')
    expect(rows).toHaveLength(2)
  })

  it('trims unquoted values', () => {
    const rows = parseCSV('a,b\n 1 , 2 \n')
    expect(rows[0]).toEqual({ a: '1', b: '2' })
  })

  it('returns [] for single-line input', () => {
    expect(parseCSV('a,b\n')).toEqual([])
  })
})
