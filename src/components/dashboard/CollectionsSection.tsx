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
        await updateCollection(form.id, {
          name: form.name.trim() || undefined,
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          releaseDate: form.releaseDate || null,
        })
      } else {
        await createCollection({
          name: form.name,
          slug: form.slug,
          description: form.description,
          releaseDate: form.releaseDate || null,
        })
      }
      setForm(null)
      setNotice(form.id ? 'Collezione aggiornata' : 'Collezione creata')
      await load()
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
      setNotice('Collezione eliminata')
      await load()
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-zinc-50">Collezioni</h1>
          <p className="mt-1 text-sm text-zinc-400">Serie ed edizioni del catalogo.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuova Collezione
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Caricamento...</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-zinc-500">Nessuna collezione</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Uscita</th>
                <th className="px-4 py-3">Descrizione</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-semibold text-zinc-100">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{c.slug}</td>
                  <td className="px-4 py-3 text-zinc-400">{fmtDate(c.releaseDate)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-400">{c.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg border-2 border-zinc-700 p-1.5 text-zinc-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        aria-label={`Modifica ${c.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="rounded-lg border-2 border-zinc-700 p-1.5 text-zinc-300 hover:border-red-500/50 hover:text-red-400"
                        aria-label={`Elimina ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form ? (
        <CollectionForm
          form={form}
          busy={busy}
          onChange={setForm}
          onCancel={() => setForm(null)}
          onSave={save}
        />
      ) : null}
    </div>
  )
}

function CollectionForm({
  form,
  busy,
  onChange,
  onCancel,
  onSave,
}: {
  form: FormState
  busy: boolean
  onChange: (f: FormState) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border-2 border-zinc-700 bg-zinc-900 p-5">
        <h2 className="text-lg font-black text-zinc-50">
          {form.id ? 'Modifica collezione' : 'Nuova collezione'}
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">Nome *</span>
            <input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => onChange({ ...form, slug: e.target.value })}
              placeholder="lasciato vuoto: generato dal nome"
              className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Data di uscita
            </span>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => onChange({ ...form, releaseDate: e.target.value })}
              className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">Descrizione</span>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border-2 border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-zinc-100"
          >
            Annulla
          </button>
          <button
            onClick={onSave}
            disabled={busy || !form.name.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {busy ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
