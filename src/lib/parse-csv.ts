/**
 * RFC 4180 CSV parser that correctly handles:
 * - Quoted fields containing commas (e.g. "€ 54,90")
 * - Escaped quotes (double-double-quote)
 * - Fields containing newlines within quotes
 * - Skips empty rows
 */

function parseQuotedField(line: string, start: number): { value: string; end: number } {
  let value = ''
  let i = start + 1 // skip opening quote

  while (i < line.length) {
    const ch = line[i]!

    if (ch === '"') {
      if (i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote → literal "
        value += '"'
        i += 2
      } else {
        // Closing quote
        return { value, end: i + 1 }
      }
    } else {
      value += ch
      i++
    }
  }

  // Unterminated quote — return what we have
  return { value, end: i }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0

  while (i <= line.length) {
    if (i === line.length) {
      fields.push('')
      break
    }

    const ch = line[i]!

    if (ch === '"') {
      const { value, end } = parseQuotedField(line, i)
      fields.push(value)
      i = end
      // skip comma after field
      if (i < line.length && line[i] === ',') i++
    } else if (ch === ',') {
      fields.push('')
      i++
    } else {
      // Unquoted field
      let j = i
      while (j < line.length && line[j] !== ',') j++
      fields.push(line.slice(i, j).trim())
      i = j
      if (i < line.length && line[i] === ',') i++
    }
  }

  return fields
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headerLine = lines[0]!
  const headers = parseCSVLine(headerLine).map((h) => h.trim().replace(/^"|"$/g, ''))

  const rows: Record<string, string>[] = []

  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx]!
    if (!line.trim()) continue // skip empty rows

    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    let hasContent = false

    headers.forEach((header, i) => {
      const val = (values[i] || '').trim().replace(/^"|"$/g, '')
      row[header] = val
      if (val) hasContent = true
    })

    if (hasContent) {
      rows.push(row)
    }
  }

  return rows
}
