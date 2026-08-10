'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createCollection,
  deleteCollection,
  getCollectionsFull,
  updateCollection,
  type CollectionDTO,
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
} from './ui'

interface FormState {
  id: string | null
  name: string
  slug: string
  description: string
  releaseDate: string
}

const EMPTY_FORM: FormState = { id: null, name: '', slug: '', description: '', releaseDate: '' }

export function CollectionsSection() {
  const [collections, setCollections] = useState<CollectionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCollections(await getCollectionsFull())
    } catch {
      setError('Errore nel caricamento collezioni')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => setForm(EMPTY_FORM)
  const openEdit = (c: CollectionDTO) =>
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
        const saved = await updateCollection(form.id, {
          name: form.name.trim() || undefined,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          releaseDate: form.releaseDate || null,
        })
        setCollections((prev) => prev.map((c) => (c.id === form.id ? saved : c)))
      } else {
        const saved = await createCollection({
          name: form.name,
          slug: form.slug,
          description: form.description,
          releaseDate: form.releaseDate || null,
        })
        setCollections((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setForm(null)
      setNotice(form.id ? 'Collezione aggiornata' : 'Collezione creata')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: CollectionDTO) => {
    if (!confirm(`Eliminare la collezione "${c.name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteCollection(c.id)
      setCollections((prev) => prev.filter((x) => x.id !== c.id))
      setNotice('Collezione eliminata')
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
      <PageHeader title="Collezioni" description="Serie ed edizioni del catalogo.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuova Collezione
        </Button>
      </PageHeader>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessuna collezione</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Nome</Th>
              <Th>Slug</Th>
              <Th>Uscita</Th>
              <Th>Descrizione</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {collections.map((c) => (
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
          title={form.id ? 'Modifica collezione' : 'Nuova collezione'}
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
            <Field label="Nome *" htmlFor="collection-name">
              <Input
                id="collection-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Slug" htmlFor="collection-slug" hint="Lasciato vuoto: generato dal nome">
              <Input
                id="collection-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Data di uscita" htmlFor="collection-release">
              <Input
                id="collection-release"
                type="date"
                value={form.releaseDate}
                onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
              />
            </Field>
            <Field label="Descrizione" htmlFor="collection-description">
              <Textarea
                id="collection-description"
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
