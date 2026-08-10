'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createCategory,
  deleteCategory,
  getCategoriesFull,
  updateCategory,
  type CategoryDTO,
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
}

const EMPTY_FORM: FormState = { id: null, name: '', slug: '', description: '' }

export function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCategories(await getCategoriesFull())
    } catch {
      setError('Errore nel caricamento categorie')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => setForm(EMPTY_FORM)
  const openEdit = (c: CategoryDTO) =>
    setForm({ id: c.id, name: c.name, slug: c.slug, description: c.description || '' })

  const save = async () => {
    if (!form) return
    setBusy(true)
    setError(null)
    try {
      if (form.id) {
        const saved = await updateCategory(form.id, {
          name: form.name.trim() || undefined,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
        })
        setCategories((prev) => prev.map((c) => (c.id === form.id ? saved : c)))
      } else {
        const saved = await createCategory({
          name: form.name,
          slug: form.slug,
          description: form.description,
        })
        setCategories((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setForm(null)
      setNotice(form.id ? 'Categoria aggiornata' : 'Categoria creata')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il salvataggio')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: CategoryDTO) => {
    if (!confirm(`Eliminare la categoria "${c.name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteCategory(c.id)
      setCategories((prev) => prev.filter((x) => x.id !== c.id))
      setNotice('Categoria eliminata')
    } catch {
      setError('Errore durante l\'eliminazione')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Categorie" description="Organizza i prodotti per categoria di vendita.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuova Categoria
        </Button>
      </PageHeader>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessuna categoria</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Nome</Th>
              <Th>Slug</Th>
              <Th>Descrizione</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {categories.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-[var(--ui-text)]">{c.name}</Td>
                <Td className="font-mono text-xs text-[var(--ui-text-muted)]">{c.slug}</Td>
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
          title={form.id ? 'Modifica categoria' : 'Nuova categoria'}
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
            <Field label="Nome *" htmlFor="category-name">
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Slug" htmlFor="category-slug" hint="Lasciato vuoto: generato dal nome">
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Descrizione" htmlFor="category-description">
              <Textarea
                id="category-description"
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
