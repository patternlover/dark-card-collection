'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { runQuery } from '@/app/dashboard/actions'
import { Alert, Button, Card, PageHeader, Spinner, Textarea } from './ui'

export function SqlSection() {
  const [sql, setSql] = useState('')
  const [running, setRunning] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [timeMs, setTimeMs] = useState(0)
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    if (!sql.trim() || running) return
    setRunning(true)
    setError(null)
    try {
      const res = await runQuery(sql)
      if (res.error) {
        setError(res.error)
        setColumns([])
        setRows([])
      } else {
        setColumns(res.columns)
        setRows(res.rows)
        setRowCount(res.rowCount)
        setTimeMs(res.timeMs)
        setTruncated(res.truncated)
      }
    } catch {
      setError('Errore durante l\'esecuzione della query')
      setColumns([])
      setRows([])
    } finally {
      setRunning(false)
    }
  }

  const formatCell = (v: unknown): string => {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Query SQL"
        description="Interroga il database in sola lettura per vedere i dati raw. Solo SELECT, SHOW, EXPLAIN e WITH."
      />

      <div className="space-y-2">
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleRun()
            }
          }}
          placeholder="SELECT * FROM products LIMIT 50;"
          spellCheck={false}
          className="h-32 font-mono"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleRun} disabled={running || !sql.trim()}>
            {running ? <Spinner /> : <Play className="h-4 w-4" />}
            {running ? 'Esecuzione...' : 'Esegui'}
          </Button>
          <p className="text-xs text-[var(--ui-text-faint)]">Scorciatoia: Ctrl + Invio</p>
        </div>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {columns.length > 0 ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-[var(--ui-text-muted)]">
            <span>{rowCount} righe</span>
            <span>·</span>
            <span>{timeMs} ms</span>
            {truncated ? <span className="text-[var(--ui-warning)]">· risultato troncato a 500 righe</span> : null}
          </div>
          <Card className="p-0">
            <div className="max-h-[480px] overflow-auto rounded-lg">
              <table className="w-full text-left text-xs text-[var(--ui-text)]">
                <thead className="sticky top-0 bg-[var(--ui-surface-alt)] text-[11px] font-semibold uppercase tracking-widest text-[var(--ui-text-muted)]">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="whitespace-nowrap border-b border-[var(--ui-border)] px-3 py-2">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--ui-surface-alt)]/60">
                      {columns.map((c) => (
                        <td key={c} className="whitespace-nowrap px-3 py-1.5 font-mono text-[var(--ui-text-muted)]">
                          {formatCell(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
