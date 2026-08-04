import { Pool, type QueryResultRow } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URI || '',
      max: 1,
    })
  }
  return pool
}

const MAX_ROWS = 500
const ALLOWED_PREFIXES = ['select', 'show', 'explain', 'with']
const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|comment|analyze|vacuum|copy|merge|upsert)\b/i

export interface QueryOutcome {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  timeMs: number
  truncated: boolean
  error?: string
}

export async function runReadOnlyQuery(sql: string): Promise<QueryOutcome> {
  const trimmed = sql.trim().replace(/;+\s*$/, '')
  if (!trimmed) {
    return { columns: [], rows: [], rowCount: 0, timeMs: 0, truncated: false, error: 'Query vuota' }
  }

  const first = trimmed.split(/\s+/, 1)[0]?.toLowerCase() || ''
  if (!ALLOWED_PREFIXES.includes(first)) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      timeMs: 0,
      truncated: false,
      error: 'Solo query di sola lettura (SELECT, SHOW, EXPLAIN, WITH)',
    }
  }

  if (FORBIDDEN_KEYWORDS.test(trimmed)) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      timeMs: 0,
      truncated: false,
      error: 'La query contiene parole chiave non consentite (solo lettura)',
    }
  }

  if (trimmed.includes(';')) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      timeMs: 0,
      truncated: false,
      error: 'Una sola istruzione per volta (niente multi-statement)',
    }
  }

  const start = Date.now()
  try {
    const client = await getPool().connect()
    try {
      const res = await client.query<QueryResultRow>({
        text: trimmed,
        rowLimit: MAX_ROWS + 1,
      } as any)
      const timeMs = Date.now() - start
      const truncated = res.rows.length > MAX_ROWS
      const limited = truncated ? res.rows.slice(0, MAX_ROWS) : res.rows
      return {
        columns: res.fields.map((f: any) => f.name),
        rows: limited as unknown as Record<string, unknown>[],
        rowCount: res.rowCount ?? limited.length,
        timeMs,
        truncated,
      }
    } finally {
      client.release()
    }
  } catch (err) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      timeMs: Date.now() - start,
      truncated: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
