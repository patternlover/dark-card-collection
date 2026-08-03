/**
 * RFC 4180 CSV parser that correctly handles:
 * - Quoted fields containing commas (e.g. "€ 54,90")
 * - Escaped quotes (double-double-quote)
 * - Fields containing newlines within quotes
 * - Skips empty rows
 */

/**
 * Splits CSV text into logical lines, keeping newlines that appear
 * inside quoted fields together with their row.
 */
function getCSVLines(text: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  const chars = text.split('')

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!

    if (ch === '"') {
      if (inQuotes && chars[i + 1] === '"') {
        // Escaped quote → keep both characters
        current += ch
        i++
        current += chars[i]!
      } else {
        current += ch
        inQuotes = !inQuotes
      }
    } else if (ch === '\n') {
      if (inQuotes) {
        current += ch
      } else {
        const line = current.endsWith('\r') ? current.slice(0, -1) : current
        result.push(line)
        current = ''
      }
    } else {
      current += ch
    }
  }

  if (current !== '') {
    const line = current.endsWith('\r') ? current.slice(0, -1) : current
    result.push(line)
  }

  return result
}

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

  // Unterminated quote, return what we have
  return { value, end: i }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0

  while (i < line.length) {
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

  // A trailing comma means one more empty field
  if (line[line.length - 1] === ',') {
    fields.push('')
  }

  return fields
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = getCSVLines(text)
  if (lines.length < 2) return []

  const headerLine = lines[0]!
  const headers = parseCSVLine(headerLine).map((h) => h.trim())

  const rows: Record<string, string>[] = []

  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx]!
    if (!line.trim()) continue // skip empty rows

    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    let hasContent = false

    headers.forEach((header, i) => {
      const val = (values[i] || '').trim()
      row[header] = val
      if (val) hasContent = true
    })

    if (hasContent) {
      rows.push(row)
    }
  }

  return rows
}
