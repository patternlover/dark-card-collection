'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import {
  getHeader,
  getSiteSettings,
  updateHeader,
  updateSiteSettings,
  type HeaderNavItem,
} from '@/app/dashboard/actions'

export function SettingsSection() {
  const [siteName, setSiteName] = useState('')
  const [description, setDescription] = useState('')
  const [navItems, setNavItems] = useState<HeaderNavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [settings, header] = await Promise.all([getSiteSettings(), getHeader()])
      setSiteName(settings.siteName ?? '')
      setDescription(settings.description ?? '')
      setNavItems(header.navItems.length > 0 ? header.navItems : [{ label: '', url: '' }])
    } catch {
      setError('Errore nel caricamento impostazioni')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateNav = (i: number, patch: Partial<HeaderNavItem>) =>
    setNavItems((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...patch } : n)))

  const addNav = () => setNavItems((prev) => [...prev, { label: '', url: '' }])

  const removeNav = (i: number) => setNavItems((prev) => prev.filter((_, idx) => idx !== i))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await updateSiteSettings({ siteName: siteName.trim() || null, description: description.trim() || null })
      await updateHeader({ navItems })
      setNotice('Impostazioni salvate')
    } catch {
      setError('Errore durante il salvataggio')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-50">Impostazioni</h1>
        <p className="mt-1 text-sm text-zinc-400">Dati del sito e voci di navigazione dell'header.</p>
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
      ) : (
        <>
          <section className="rounded-xl border-2 border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-black text-zinc-100">Informazioni sito</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Nome sito
                </span>
                <input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Descrizione / tagline
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border-2 border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-zinc-100">Menu header</h2>
              <button
                onClick={addNav}
                className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Plus className="h-3.5 w-3.5" /> Aggiungi voce
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {navItems.map((item, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    value={item.label}
                    onChange={(e) => updateNav(i, { label: e.target.value })}
                    placeholder="Etichetta"
                    className="min-w-[160px] flex-1 rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
                  />
                  <input
                    value={item.url}
                    onChange={(e) => updateNav(i, { url: e.target.value })}
                    placeholder="/pagina"
                    className="min-w-[160px] flex-1 rounded-lg border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={() => removeNav(i)}
                    disabled={navItems.length <= 1}
                    className="rounded-lg border-2 border-zinc-700 p-2 text-zinc-400 hover:border-red-500/50 hover:text-red-400 disabled:opacity-30"
                    aria-label="Rimuovi voce"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {busy ? 'Salvataggio...' : 'Salva impostazioni'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
