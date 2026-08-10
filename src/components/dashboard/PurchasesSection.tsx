'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import {
  getCategories,
  getCollections,
  getPurchases,
  createPurchase,
  deletePurchase,
  type CategoryOption,
  type CollectionOption,
  type PurchaseDTO,
} from '@/app/dashboard/actions'
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Textarea,
  Toolbar,
  Tr,
} from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export function PurchasesSection() {
  const [purchases, setPurchases] = useState<PurchaseDTO[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  // Form stato per nuovo acquisto
  const [form, setForm] = useState({
    title: '',
    costOfGoodsSold: '',
    quantity: '1',
    store: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    autoCreateProduct: true,
    productPrice: '',
    category: '',
    collection: '',
    imageLink: '',
  })

  const load = useCallback(
    async (opts: { page?: number; search?: string } = {}) => {
      setLoading(true)
      try {
        const res = await getPurchases({
          search: opts.search ?? query,
          page: opts.page ?? page,
          limit: 25,
        })
        setPurchases(res.docs)
        setTotal(res.total)
        setTotalPages(Math.max(1, res.totalPages))
      } catch {
        setMessage({ text: 'Errore nel caricamento acquisti', type: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [query, page],
  )

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getCollections().then(setCollections).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const runSearch = () => {
    setPage(1)
    load({ page: 1, search: query })
  }

  const handleCreate = async () => {
    if (!form.title.trim()) {
      notify('Il titolo è obbligatorio', 'error')
      return
    }
    const cogs = Number(form.costOfGoodsSold)
    if (isNaN(cogs) || cogs < 0) {
      notify('Inserisci un prezzo di acquisto valido', 'error')
      return
    }
    setBusy(true)
    try {
      await createPurchase({
        title: form.title.trim(),
        costOfGoodsSold: cogs,
        quantity: Number(form.quantity) || 1,
        store: form.store.trim() || null,
        purchaseDate: form.purchaseDate || null,
        notes: form.notes.trim() || null,
        autoCreateProduct: form.autoCreateProduct,
        productPrice: form.productPrice ? Number(form.productPrice) : null,
        category: form.category ? Number(form.category) : null,
        collection: form.collection ? Number(form.collection) : null,
        imageLink: form.imageLink.trim() || null,
      })
      setShowCreate(false)
      setForm({
        title: '',
        costOfGoodsSold: '',
        quantity: '1',
        store: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        autoCreateProduct: true,
        productPrice: '',
        category: '',
        collection: '',
        imageLink: '',
      })
      notify('Acquisto registrato e inventario aggiornato con successo')
      load()
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Eliminare la registrazione di acquisto per "${title}"?`)) return
    setBusy(true)
    try {
      await deletePurchase(id)
      notify('Acquisto eliminato')
      load()
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Acquisti"
        description={`${total} registrazioni d'acquisto · storico fornitori, edicole e supermercati`}
      >
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Registra Acquisto
        </Button>
      </PageHeader>

      <Toolbar>
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
            placeholder="Cerca per titolo o negozio/fornitore..."
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={runSearch}>
          Cerca
        </Button>
      </Toolbar>

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun acquisto registrato</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Data</Th>
              <Th>Prodotto</Th>
              <Th>Negozio / Fornitore</Th>
              <Th>Costo unitario</Th>
              <Th>Qty</Th>
              <Th>Totale Costo</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {purchases.map((p) => {
              const totalCost = (p.costOfGoodsSold || 0) * (p.quantity || 1)
              return (
                <Tr key={p.id}>
                  <Td className="text-xs text-[var(--ui-text-muted)]">
                    {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('it-IT') : '—'}
                  </Td>
                  <Td className="font-medium text-[var(--ui-text)]">{p.title}</Td>
                  <Td className="text-[var(--ui-text-muted)]">{p.store || '—'}</Td>
                  <Td>{euro.format(p.costOfGoodsSold || 0)}</Td>
                  <Td className="text-[var(--ui-text-muted)]">{p.quantity}</Td>
                  <Td className="font-semibold text-[var(--ui-text)]">{euro.format(totalCost)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(p.id, p.title)}
                        disabled={busy}
                        title="Elimina acquisto"
                        className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </TBody>
        </Table>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-[var(--ui-border)] pt-4">
          <p className="text-xs text-[var(--ui-text-muted)]">
            Pagina {page} di {totalPages} · {total} acquisti
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" /> Precedente
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Successiva <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <Modal
          title="Registra Nuovo Acquisto"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreate} disabled={busy || !form.title.trim()}>
                {busy ? 'Salvataggio...' : 'Registra e Carica in Inventario'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Titolo Prodotto *" htmlFor="ac-title">
              <Input
                id="ac-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="es. Booster Box Pokémon"
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Prezzo Acquisto Unitario (€) *" htmlFor="ac-cogs">
                <Input
                  id="ac-cogs"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costOfGoodsSold}
                  onChange={(e) => setForm({ ...form, costOfGoodsSold: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Quantità *" htmlFor="ac-qty">
                <Input
                  id="ac-qty"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </Field>
              <Field label="Data Acquisto" htmlFor="ac-date">
                <Input
                  id="ac-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Negozio / Fornitore" htmlFor="ac-store">
              <Input
                id="ac-store"
                type="text"
                value={form.store}
                onChange={(e) => setForm({ ...form, store: e.target.value })}
                placeholder="es. Edicola Stazione / Supermercato Esselunga"
              />
            </Field>

            <div className="border-t border-[var(--ui-border)] pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ui-text-faint)]">
                Carico Automatico in Catalogo / Inventario
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prezzo Vendita Al Pubblico (€)" htmlFor="ac-price">
                  <Input
                    id="ac-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.productPrice}
                    onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                    placeholder="Se vuoto calcolato automatico"
                  />
                </Field>
                <Field label="Image Link (URL)" htmlFor="ac-img">
                  <Input
                    id="ac-img"
                    type="url"
                    value={form.imageLink}
                    onChange={(e) => setForm({ ...form, imageLink: e.target.value })}
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Categoria" htmlFor="ac-cat">
                  <Select
                    id="ac-cat"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">— Seleziona Categoria —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Collezione" htmlFor="ac-col">
                  <Select
                    id="ac-col"
                    value={form.collection}
                    onChange={(e) => setForm({ ...form, collection: e.target.value })}
                  >
                    <option value="">— Seleziona Collezione —</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>

            <Field label="Note" htmlFor="ac-notes">
              <Textarea
                id="ac-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Note opzionali..."
              />
            </Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
