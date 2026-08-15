'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { CheckCheck, ChevronLeft, ChevronRight, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import {
  deleteMessage,
  getMessageBody,
  getMessagesPage,
  toggleMessageRead,
  toggleMessageReplied,
  type MessageDTO,
} from '@/app/dashboard/actions'
import { Alert, Badge, Button, PageHeader, SortableTh, Spinner, Table, TBody, Td, Th, THead, Tr, useSort, useSortedList } from './ui'

const PAGE_SIZE = 20

export function MessagesSection() {
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const { sortBy, sortDir, handleSort } = useSort('createdAt')
  const sorted = useSortedList(messages, sortBy, sortDir)
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
        <Table>
          <THead>
            <Tr>
              <SortableTh label="Nome" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Email" field="email" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Oggetto" field="subject" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Data" field="createdAt" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <Th>Stato</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {sorted.map((m) => {
              const expanded = expandedId === m.id
              const body = bodies[m.id]
              const loadingBody = loadingBodyId === m.id
              return (
                <Fragment key={m.id}>
                  <Tr className={expanded ? 'bg-[var(--ui-surface-alt)]/60' : ''}>
                    <Td>
                      <div className="flex items-center gap-2">
                        {m.read ? <MailOpen className="h-3.5 w-3.5 shrink-0 text-[var(--ui-text-faint)]" /> : <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--ui-accent-hover)]" />}
                        <span className={`truncate font-medium ${m.read ? 'text-[var(--ui-text-muted)]' : 'text-[var(--ui-text)]'}`}>{m.name}</span>
                      </div>
                    </Td>
                    <Td className="text-[var(--ui-text-muted)]">{m.email}</Td>
                    <Td className="max-w-xs truncate text-[var(--ui-text-muted)]">{m.subject || '(nessun oggetto)'}</Td>
                    <Td className="text-[var(--ui-text-muted)]">{new Date(m.createdAt).toLocaleDateString('it-IT')}</Td>
                    <Td>
                      {!m.read ? <Badge tone="accent">Nuovo</Badge> : null}
                      {m.replied ? <Badge tone="success">Risposto</Badge> : null}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRead(m, !m.read)}
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                          title={m.read ? 'Segna come non letto' : 'Segna come letto'}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReplied(m, !m.replied)}
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                          title={m.replied ? 'Segna come non risposto' : 'Segna come risposto'}
                        >
                          <Reply className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => remove(m)}
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                          title="Elimina"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                  {expanded ? (
                    <Tr key={`${m.id}-detail`}>
                      <Td colSpan={6} className="p-0">
                        <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 px-4 py-3">
                          {loadingBody ? (
                            <p className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
                              <Spinner /> Caricamento...
                            </p>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ui-text-muted)]">
                              {body ?? m.message ?? '—'}
                            </p>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ) : null}
                </Fragment>
              )
            })}
          </TBody>
        </Table>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-[var(--ui-border)] pt-4">
          <p className="text-xs text-[var(--ui-text-muted)]">
            Pagina {page} di {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Precedente
            </Button>
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
      ) : null}
    </div>
  )
}
