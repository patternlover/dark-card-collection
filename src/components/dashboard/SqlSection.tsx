'use client'

import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { runQuery } from '@/app/dashboard/actions'

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
      <div>
        <h1 className="text-3xl font-black text-zinc-50">Query SQL</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Interroga il database in sola lettura per vedere i dati raw. Solo SELECT, SHOW, EXPLAIN e WITH.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
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
          className="h-32 w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={handleRun}
          disabled={running || !sql.trim()}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Esecuzione...' : 'Esegui'}
        </button>
        <p className="text-xs text-zinc-600">Scorciatoia: Ctrl + Invio</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {columns.length > 0 ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{rowCount} righe</span>
            <span>·</span>
            <span>{timeMs} ms</span>
            {truncated ? <span className="text-amber-400">· risultato troncato a 500 righe</span> : null}
          </div>
          <div className="max-h-[480px] overflow-auto rounded-xl border-2 border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-900 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="whitespace-nowrap border-b border-zinc-800 px-3 py-2">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-900/50">
                    {columns.map((c) => (
                      <td key={c} className="whitespace-nowrap px-3 py-1.5 font-mono text-zinc-300">
                        {formatCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
