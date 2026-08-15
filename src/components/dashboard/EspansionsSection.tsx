'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createEspansione,
  deleteEspansione,
  getEspansioniFull,
  updateEspansione,
  type EspansioneDTO,
} from '@/app/dashboard/actions'
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Textarea,
  Tr,
  SortableTh,
  useSort,
  useSortedList,
} from './ui'

interface FormState {
  id: string | null
  name: string
  slug: string
  description: string
  releaseDate: string
}

const EMPTY_FORM: FormState = { id: null, name: '', slug: '', description: '', releaseDate: '' }

export function EspansionsSection() {
  const [espansioni, setEspansioni] = useState<EspansioneDTO[]>([])
  const { sortBy, sortDir, handleSort } = useSort('name')
  const sorted = useSortedList(espansioni, sortBy, sortDir)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEspansioni(await getEspansioniFull())
    } catch {
      setError('Errore nel caricamento espansioni')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => setForm(EMPTY_FORM)
  const openEdit = (c: EspansioneDTO) =>
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      releaseDate: c.releaseDate ? c.releaseDate.slice(0, 10) : '',
    })

  const save = async () => {
    if (!form) return
    setBusy(true)
    setError(null)
    try {
      if (form.id) {
        const saved = await updateEspansione(form.id, {
          name: form.name.trim() || undefined,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          releaseDate: form.releaseDate || null,
        })
        setEspansioni((prev) => prev.map((c) => (c.id === form.id ? saved : c)))
      } else {
        const saved = await createEspansione({
          name: form.name,
          slug: form.slug,
          description: form.description,
          releaseDate: form.releaseDate || null,
        })
        setEspansioni((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setForm(null)
      setNotice(form.id ? 'Espansione aggiornata' : 'Espansione creata')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: EspansioneDTO) => {
    if (!confirm(`Eliminare l'espansione "${c.name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteEspansione(c.id)
      setEspansioni((prev) => prev.filter((x) => x.id !== c.id))
      setNotice('Espansione eliminata')
    } catch {
      setError('Errore durante l\'eliminazione')
    } finally {
      setBusy(false)
    }
  }

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('it-IT')
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Espansioni" description="Serie ed edizioni del catalogo.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuova Espansione
        </Button>
      </PageHeader>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : espansioni.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessuna espansione</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <SortableTh label="Nome" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Slug" field="slug" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Uscita" field="releaseDate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <Th>Descrizione</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {sorted.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-[var(--ui-text)]">{c.name}</Td>
                <Td className="font-mono text-xs text-[var(--ui-text-muted)]">{c.slug}</Td>
                <Td className="text-[var(--ui-text-muted)]">{fmtDate(c.releaseDate)}</Td>
                <Td className="max-w-xs truncate text-[var(--ui-text-muted)]">{c.description || '—'}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(c)}
                      aria-label={`Modifica ${c.name}`}
                      className="p-1.5"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => remove(c)}
                      aria-label={`Elimina ${c.name}`}
                      className="p-1.5 text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      {form ? (
        <Modal
          title={form.id ? 'Modifica espansione' : 'Nuova espansione'}
          onClose={() => setForm(null)}
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setForm(null)}>
                Annulla
              </Button>
              <Button onClick={save} disabled={busy || !form.name.trim()}>
                {busy ? 'Salvataggio...' : 'Salva'}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <Field label="Nome *" htmlFor="expansion-name">
              <Input
                id="expansion-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Slug" htmlFor="expansion-slug">
              <Input
                id="expansion-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Data di uscita" htmlFor="expansion-release">
              <Input
                id="expansion-release"
                type="date"
                value={form.releaseDate}
                onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
              />
            </Field>
            <Field label="Descrizione" htmlFor="expansion-description">
              <Textarea
                id="expansion-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
