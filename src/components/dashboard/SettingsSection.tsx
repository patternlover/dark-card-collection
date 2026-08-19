'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import {
  createOperatingCost,
  deleteOperatingCost,
  getHeader,
  getOperatingCosts,
  getSiteSettings,
  updateHeader,
  updateOperatingCost,
  updateSiteSettings,
  type HeaderNavItem,
  type OperatingCostDTO,
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
  Modal,
  PageHeader,
  Select,
  Textarea,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Mensile' },
  { value: 'quarterly', label: 'Trimestrale' },
  { value: 'yearly', label: 'Annuale' },
]

const CATEGORY_OPTIONS = [
  { value: 'hosting', label: 'Hosting/Dominio' },
  { value: 'software', label: 'Software' },
  { value: 'fees', label: 'Commissioni' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Altro' },
]

function toMonthly(amount: number, frequency: string): number {
  if (frequency === 'quarterly') return amount / 3
  if (frequency === 'yearly') return amount / 12
  return amount
}

interface CostForm {
  description: string
  amount: string
  frequency: string
  category: string
  notes: string
}

function emptyCostForm(): CostForm {
  return { description: '', amount: '', frequency: 'monthly', category: 'other', notes: '' }
}

export function SettingsSection() {
  const [siteName, setSiteName] = useState('')
  const [description, setDescription] = useState('')
  const [navItems, setNavItems] = useState<HeaderNavItem[]>([])
  const [costs, setCosts] = useState<OperatingCostDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showCostModal, setShowCostModal] = useState(false)
  const [editingCost, setEditingCost] = useState<OperatingCostDTO | null>(null)
  const [costForm, setCostForm] = useState<CostForm>(emptyCostForm())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [settings, header, opsCosts] = await Promise.all([
        getSiteSettings(),
        getHeader(),
        getOperatingCosts(),
      ])
      setSiteName(settings.siteName ?? '')
      setDescription(settings.description ?? '')
      setNavItems(header.navItems.length > 0 ? header.navItems : [{ label: '', url: '' }])
      setCosts(opsCosts)
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

  const openCostModal = (cost?: OperatingCostDTO) => {
    if (cost) {
      setEditingCost(cost)
      setCostForm({
        description: cost.description,
        amount: String(cost.amount),
        frequency: cost.frequency,
        category: cost.category,
        notes: cost.notes || '',
      })
    } else {
      setEditingCost(null)
      setCostForm(emptyCostForm())
    }
    setShowCostModal(true)
  }

  const saveCost = async () => {
    if (!costForm.description.trim()) {
      setError('Inserisci una descrizione')
      return
    }
    const amount = Number(costForm.amount)
    if (!amount || amount <= 0) {
      setError('Inserisci un importo valido')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (editingCost) {
        const res = await updateOperatingCost(editingCost.id, {
          description: costForm.description.trim(),
          amount,
          frequency: costForm.frequency,
          category: costForm.category,
          notes: costForm.notes.trim() || undefined,
        })
        if (!res.ok) {
          setError(res.message || 'Errore durante l\'aggiornamento')
          return
        }
      } else {
        const res = await createOperatingCost({
          description: costForm.description.trim(),
          amount,
          frequency: costForm.frequency,
          category: costForm.category,
          notes: costForm.notes.trim() || undefined,
        })
        if (!res.ok) {
          setError(res.message || 'Errore durante la creazione')
          return
        }
      }
      setShowCostModal(false)
      load()
    } catch {
      setError('Errore durante il salvataggio del costo')
    } finally {
      setBusy(false)
    }
  }

  const removeCost = async (id: string) => {
    if (!confirm('Eliminare questo costo?')) return
    try {
      await deleteOperatingCost(id)
      setCosts((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Errore durante l\'eliminazione')
    }
  }

  const activeCosts = costs.filter((c) => c.isActive)
  const totalMonthly = activeCosts.reduce((sum, c) => sum + toMonthly(c.amount, c.frequency), 0)
  const totalYearly = totalMonthly * 12

  return (
    <div className="space-y-6">
      <PageHeader title="Impostazioni" description="Dati del sito, menu header e costi operativi." />

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
              <Button variant="ghost" size="sm" onClick={addNav}>
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
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNav(i)}
                      disabled={navItems.length <= 1}
                      aria-label="Rimuovi voce"
                      className="p-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Costi operativi mensili</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => openCostModal()}>
                <Plus className="h-3.5 w-3.5" /> Aggiungi costo
              </Button>
            </CardHeader>
            <CardContent>
              {costs.length === 0 ? (
                <p className="text-sm text-[var(--ui-text-muted)]">Nessun costo operativo registrato</p>
              ) : (
                <>
                  <div className="divide-y divide-[var(--ui-border)]">
                    {costs.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium ${c.isActive ? 'text-[var(--ui-text)]' : 'text-[var(--ui-text-muted)] line-through'}`}>
                            {c.description}
                          </p>
                          <p className="text-xs text-[var(--ui-text-muted)]">
                            {CATEGORY_OPTIONS.find((o) => o.value === c.category)?.label || c.category}
                            {' · '}
                            {FREQUENCY_OPTIONS.find((o) => o.value === c.frequency)?.label || c.frequency}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="whitespace-nowrap font-semibold text-[var(--ui-text)]">
                            {euro.format(c.amount)}/{c.frequency === 'monthly' ? 'mese' : c.frequency === 'quarterly' ? 'trimestre' : 'anno'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openCostModal(c)} className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeCost(c.id)} className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-3">
                    <div>
                      <p className="text-xs text-[var(--ui-text-muted)]">Totale mensile</p>
                      <p className="text-lg font-bold text-[var(--ui-text)]">{euro.format(totalMonthly)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--ui-text-muted)]">Totale annuo</p>
                      <p className="text-lg font-bold text-[var(--ui-text)]">{euro.format(totalYearly)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={busy}>
              <Save className="h-4 w-4" /> {busy ? 'Salvataggio...' : 'Salva impostazioni'}
            </Button>
          </div>
        </>
      )}

      {showCostModal ? (
        <Modal
          title={editingCost ? 'Modifica Costo' : 'Nuovo Costo'}
          onClose={() => setShowCostModal(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCostModal(false)}>
                Annulla
              </Button>
              <Button onClick={saveCost} disabled={busy}>
                {busy ? 'Salvataggio...' : 'Salva'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Descrizione *" htmlFor="cost-desc">
              <Input
                id="cost-desc"
                value={costForm.description}
                onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                placeholder="Es. Dominio, OpenCode, Vercel"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Importo (€) *" htmlFor="cost-amount">
                <Input
                  id="cost-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costForm.amount}
                  onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Frequenza" htmlFor="cost-freq">
                <Select
                  id="cost-freq"
                  value={costForm.frequency}
                  onChange={(e) => setCostForm({ ...costForm, frequency: e.target.value })}
                >
                  {FREQUENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Categoria" htmlFor="cost-cat">
              <Select
                id="cost-cat"
                value={costForm.category}
                onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Note" htmlFor="cost-notes">
              <Textarea
                id="cost-notes"
                value={costForm.notes}
                onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
                placeholder="Note opzionali..."
                rows={2}
              />
            </Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
