'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCheck, ChevronLeft, ChevronRight, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import {
  deleteMessage,
  getMessageBody,
  getMessagesPage,
  toggleMessageRead,
  toggleMessageReplied,
  type MessageDTO,
} from '@/app/dashboard/actions'
import { Alert, Badge, Button, Card, PageHeader, Spinner } from './ui'

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
      <PageHeader
        title="Messaggi"
        description={`${total} messaggi dal form contatti · ${unread} non letti`}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun messaggio</p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const expanded = expandedId === m.id
            const body = bodies[m.id]
            const loadingBody = loadingBodyId === m.id
            return (
              <Card
                key={m.id}
                className={m.read ? '' : 'border-[var(--ui-accent)]/50'}
              >
                <button
                  onClick={() => toggleExpanded(m)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  {m.read ? (
                    <MailOpen className="h-4 w-4 shrink-0 text-[var(--ui-text-faint)]" />
                  ) : (
                    <Mail className="h-4 w-4 shrink-0 text-[var(--ui-accent-hover)]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm font-semibold ${m.read ? 'text-[var(--ui-text-muted)]' : 'text-[var(--ui-text)]'}`}>
                        {m.name}
                      </span>
                      {!m.read ? <Badge tone="accent">Nuovo</Badge> : null}
                      {m.replied ? <Badge tone="success">Risposto</Badge> : null}
                    </span>
                    <span className="block truncate text-xs text-[var(--ui-text-faint)]">
                      {m.subject || '(nessun oggetto)'} · {m.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ui-text-faint)]">
                    {new Date(m.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </button>
                {expanded ? (
                  <div className="border-t border-[var(--ui-border)] px-4 py-3">
                    {loadingBody ? (
                      <p className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
                        <Spinner /> Caricamento...
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ui-text-muted)]">
                        {body ?? m.message ?? '—'}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setRead(m, !m.read)}>
                        <CheckCheck className="h-3.5 w-3.5" />
                        {m.read ? 'Segna come non letto' : 'Segna come letto'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReplied(m, !m.replied)}
                        className="hover:border-[var(--ui-success)] hover:text-[var(--ui-success)]"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        {m.replied ? 'Segna come non risposto' : 'Segna come risposto'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => remove(m)}
                        className="text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Elimina
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            )
          })}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Precedente
            </Button>
            <span className="text-xs text-[var(--ui-text-muted)]">
              Pagina {page} di {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Successiva <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
