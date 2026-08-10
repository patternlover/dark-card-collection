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
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
  Textarea,
} from './ui'

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
      <PageHeader title="Impostazioni" description="Dati del sito e voci di navigazione dell'header." />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informazioni sito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Nome sito" htmlFor="site-name">
                <Input
                  id="site-name"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </Field>
              <Field label="Descrizione / tagline" htmlFor="site-description">
                <Textarea
                  id="site-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu header</CardTitle>
              <Button variant="secondary" size="sm" onClick={addNav}>
                <Plus className="h-3.5 w-3.5" /> Aggiungi voce
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {navItems.map((item, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      value={item.label}
                      onChange={(e) => updateNav(i, { label: e.target.value })}
                      placeholder="Etichetta"
                      className="min-w-[160px] flex-1"
                    />
                    <Input
                      value={item.url}
                      onChange={(e) => updateNav(i, { url: e.target.value })}
                      placeholder="/pagina"
                      className="min-w-[160px] flex-1"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeNav(i)}
                      disabled={navItems.length <= 1}
                      aria-label="Rimuovi voce"
                      className="p-2 text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={busy}>
              <Save className="h-4 w-4" /> {busy ? 'Salvataggio...' : 'Salva impostazioni'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
