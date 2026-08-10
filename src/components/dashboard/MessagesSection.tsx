'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCheck, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import {
  deleteMessage,
  getMessages,
  toggleMessageRead,
  toggleMessageReplied,
  type MessageDTO,
} from '@/app/dashboard/actions'

export function MessagesSection() {
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMessages(await getMessages())
    } catch {
      setError('Errore nel caricamento messaggi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setRead = async (m: MessageDTO, read: boolean) => {
    try {
      const updated = await toggleMessageRead(m.id, read)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)))
    } catch {
      setError('Errore durante l\'aggiornamento')
    }
  }

  const setReplied = async (m: MessageDTO, replied: boolean) => {
    try {
      const updated = await toggleMessageReplied(m.id, replied)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)))
    } catch {
      setError('Errore durante l\'aggiornamento')
    }
  }

  const remove = async (m: MessageDTO) => {
    if (!confirm('Eliminare il messaggio?')) return
    try {
      await deleteMessage(m.id)
      setMessages((prev) => prev.filter((x) => x.id !== m.id))
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
          {messages.length} messaggi dal form contatti · {unread} non letti
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
            return (
              <div
                key={m.id}
                className={`rounded-xl border-2 ${m.read ? 'border-zinc-800 bg-zinc-950/40' : 'border-[var(--accent)]/60 bg-zinc-900/80'}`}
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : m.id)}
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
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {m.message || '—'}
                    </p>
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
        </div>
      )}
    </div>
  )
}
