'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCheck, ChevronLeft, ChevronRight, Loader2, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import {
  deleteMessage,
  getMessageBody,
  getMessagesPage,
  toggleMessageRead,
  toggleMessageReplied,
  type MessageDTO,
} from '@/app/dashboard/actions'

const PAGE_SIZE = 20

export function MessagesSection() {
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingBodyId, setLoadingBodyId] = useState<string | null>(null)
  const [bodies, setBodies] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMessagesPage(page, PAGE_SIZE)
      setMessages(res.messages)
      setTotal(res.total)
    } catch {
      setError('Errore nel caricamento messaggi')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const toggleExpanded = (m: MessageDTO) => {
    const next = expandedId === m.id ? null : m.id
    setExpandedId(next)
    if (next && bodies[next] === undefined) {
      setLoadingBodyId(next)
      getMessageBody(next)
        .then((body) => setBodies((prev) => ({ ...prev, [next]: body ?? '—' })))
        .catch(() => setBodies((prev) => ({ ...prev, [next]: '—' })))
        .finally(() => setLoadingBodyId(null))
    }
  }

  const setRead = async (m: MessageDTO, read: boolean) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)))
    try {
      const res = await toggleMessageRead(m.id, read)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: res.read } : x)))
    } catch {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: !read } : x)))
      setError('Errore durante l\'aggiornamento')
    }
  }

  const setReplied = async (m: MessageDTO, replied: boolean) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, replied } : x)))
    try {
      const res = await toggleMessageReplied(m.id, replied)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, replied: res.replied } : x)))
    } catch {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, replied: !replied } : x)))
      setError('Errore durante l\'aggiornamento')
    }
  }

  const remove = async (m: MessageDTO) => {
    if (!confirm('Eliminare il messaggio?')) return
    try {
      await deleteMessage(m.id)
      setMessages((prev) => prev.filter((x) => x.id !== m.id))
      setTotal((t) => Math.max(0, t - 1))
    } catch {
      setError('Errore durante l\'eliminazione')
    }
  }

  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black text-zinc-50">Messaggi</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {total} messaggi dal form contatti · {unread} non letti
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Caricamento...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-zinc-500">Nessun messaggio</p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const expanded = expandedId === m.id
            const body = bodies[m.id]
            const loadingBody = loadingBodyId === m.id
            return (
              <div
                key={m.id}
                className={`rounded-xl border-2 ${m.read ? 'border-zinc-800 bg-zinc-950/40' : 'border-[var(--accent)]/60 bg-zinc-900/80'}`}
              >
                <button
                  onClick={() => toggleExpanded(m)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  {m.read ? (
                    <MailOpen className="h-4 w-4 shrink-0 text-zinc-500" />
                  ) : (
                    <Mail className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm font-semibold ${m.read ? 'text-zinc-300' : 'text-zinc-50'}`}>
                        {m.name}
                      </span>
                      {!m.read ? (
                        <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-black uppercase text-black">
                          Nuovo
                        </span>
                      ) : null}
                      {m.replied ? (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-400">
                          Risposto
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {m.subject || '(nessun oggetto)'} · {m.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {new Date(m.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </button>
                {expanded ? (
                  <div className="border-t-2 border-zinc-800 px-4 py-3">
                    {loadingBody ? (
                      <p className="flex items-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Caricamento...
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {body ?? m.message ?? '—'}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setRead(m, !m.read)}
                        className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {m.read ? 'Segna come non letto' : 'Segna come letto'}
                      </button>
                      <button
                        onClick={() => setReplied(m, !m.replied)}
                        className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-green-500/50 hover:text-green-400"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        {m.replied ? 'Segna come non risposto' : 'Segna come risposto'}
                      </button>
                      <button
                        onClick={() => remove(m)}
                        className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-red-500/50 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Elimina
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-40 hover:enabled:border-[var(--accent)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Precedente
            </button>
            <span className="text-xs text-zinc-500">
              Pagina {page} di {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-40 hover:enabled:border-[var(--accent)]"
            >
              Successiva <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
