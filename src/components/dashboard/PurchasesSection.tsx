'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  getCategories,
  getEspansioni,
  getPurchases,
  getPurchaseSourceNames,
  createPurchase,
  deletePurchase,
  updatePurchase,
  searchProducts,
  type CategoryOption,
  type EspansioneOption,
  type PurchaseDTO,
} from '@/app/dashboard/actions'
import { groupProducts, type ProductGroup } from '@/lib/group-products'
import { buildVariantOptions } from '@/lib/sale-options'
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  ModalSection,
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

interface ProductOption {
  id: string
  title: string
  price?: number | null
  language?: string | null
  quantity: number
  grade?: string | null
  condition?: string | null
}

const SOURCE_TYPE_OPTIONS = [
  { value: '', label: '— Seleziona fonte —' },
  { value: 'newsstand', label: 'Edicola' },
  { value: 'supermarket', label: 'Supermercato' },
  { value: 'shop', label: 'Negozio' },
  { value: 'online', label: 'Online' },
  { value: 'private', label: 'Privato' },
  { value: 'other', label: 'Altro' },
]

interface LineForm {
  productId: string
  newProduct: boolean
  newProductTitle: string
  newProductPrice: string
  newProductCategory: string
  newProductExpansion: string
  newProductImageLink: string
  newProductItemCategory1: string
  newProductItemCategory2: string
  quantity: string
  unitCost: string
}

function emptyLine(): LineForm {
  return {
    productId: '',
    newProduct: false,
    newProductTitle: '',
    newProductPrice: '',
    newProductCategory: '',
    newProductExpansion: '',
    newProductImageLink: '',
    newProductItemCategory1: 'product',
    newProductItemCategory2: '',
    quantity: '1',
    unitCost: '',
  }
}

export function PurchasesSection() {
  const [purchases, setPurchases] = useState<PurchaseDTO[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [espansioni, setEspansioni] = useState<EspansioneOption[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<PurchaseDTO | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    sourceType: '',
    sourceName: '',
    extraCosts: '',
    notes: '',
  })
  const [lines, setLines] = useState<LineForm[]>([emptyLine()])

  const groups = useMemo(() => groupProducts(productOptions), [productOptions])
  const groupByProductId = useMemo(() => {
    const map = new Map<string, ProductGroup>()
    for (const g of groups) {
      for (const p of g.products) map.set(String(p.id), g)
    }
    return map
  }, [groups])

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

  const refreshProductOptions = useCallback(() => {
    searchProducts({ limit: 200 })
      .then((res) =>
        setProductOptions(
          res.docs.map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price ?? null,
            language: p.language ?? null,
            quantity: p.quantity ?? 0,
            grade: p.grade ?? null,
            condition: p.condition ?? null,
          })),
        ),
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getEspansioni().then(setEspansioni).catch(() => {})
    getPurchaseSourceNames().then(setSourceOptions).catch(() => {})
    refreshProductOptions()
  }, [refreshProductOptions])

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const runSearch = () => {
    setPage(1)
    load({ page: 1, search: query })
  }

  const updateLine = (index: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const openCreate = () => {
    setEditing(null)
    setModalError(null)
    getPurchaseSourceNames().then(setSourceOptions).catch(() => {})
    refreshProductOptions()
    setForm({
      purchaseDate: new Date().toISOString().split('T')[0],
      sourceType: '',
      sourceName: '',
      extraCosts: '',
      notes: '',
    })
    setLines([emptyLine()])
    setShowCreate(true)
  }

  const openEdit = (p: PurchaseDTO) => {
    setShowCreate(false)
    setExpandedId(null)
    setModalError(null)
    setEditing(p)
    refreshProductOptions()
    setForm({
      purchaseDate: p.purchaseDate ? p.purchaseDate.slice(0, 10) : new Date().toISOString().split('T')[0],
      sourceType: p.sourceType || '',
      sourceName: p.sourceName || '',
      extraCosts: p.extraCosts != null ? String(p.extraCosts) : '',
      notes: p.notes || '',
    })
    setLines(
      p.lines.length > 0
        ? p.lines.map((l) => ({
            productId: l.productId,
            newProduct: false,
            newProductTitle: '',
            newProductPrice: '',
            newProductCategory: '',
            newProductExpansion: '',
            newProductItemCategory1: 'product',
            newProductItemCategory2: '',
            newProductImageLink: '',
            quantity: String(l.quantity),
            unitCost: String(l.unitCost),
          }))
        : [emptyLine()],
    )
  }

  const resetForm = () => {
    setEditing(null)
    setShowCreate(false)
    setModalError(null)
    setForm({
      purchaseDate: new Date().toISOString().split('T')[0],
      sourceType: '',
      sourceName: '',
      extraCosts: '',
      notes: '',
    })
    setLines([emptyLine()])
  }

  const handleSubmit = async () => {
    if (!form.purchaseDate) {
      setModalError('La data di acquisto è obbligatoria')
      return
    }
    const lineInputs = lines.map((l) => ({
      productId: l.newProduct ? null : l.productId || null,
      newProductTitle: l.newProduct ? l.newProductTitle.trim() || null : null,
      newProductPrice: l.newProduct && l.newProductPrice ? Number(l.newProductPrice) : null,
      newProductCategory: l.newProduct ? l.newProductCategory || null : null,
      newProductExpansion: l.newProduct ? l.newProductExpansion || null : null,
      newProductImageLink: l.newProduct ? l.newProductImageLink.trim() || null : null,
      newProductItemCategory1: l.newProduct ? l.newProductItemCategory1 || 'product' : undefined,
      newProductItemCategory2: l.newProduct ? l.newProductItemCategory2 || undefined : undefined,
      quantity: Number(l.quantity) || 0,
      unitCost: Number(l.unitCost) || 0,
    }))
    if (lineInputs.every((l) => !l.productId && !l.newProductTitle)) {
      setModalError('Ogni riga deve avere un prodotto esistente o un nuovo titolo')
      return
    }
    if (lineInputs.every((l) => l.quantity <= 0)) {
      setModalError('Aggiungi almeno una riga con quantità maggiore di 0')
      return
    }
    setBusy(true)
    setModalError(null)
    try {
      const data = {
        purchaseDate: form.purchaseDate,
        sourceType: form.sourceType || undefined,
        sourceName: form.sourceName.trim() || undefined,
        extraCosts: form.extraCosts ? Number(form.extraCosts) : undefined,
        notes: form.notes.trim() || undefined,
        lines: lineInputs,
      }
      if (editing) {
        await updatePurchase(editing.id, data)
        notify('Lotto aggiornato e inventario riconciliato')
      } else {
        await createPurchase(data)
        notify('Lotto registrato e inventario aggiornato con successo')
      }
      resetForm()
      load()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare il lotto? Lo stock ancora in giacenza verrà rimosso.')) return
    setBusy(true)
    try {
      await deletePurchase(id)
      notify('Lotto eliminato')
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
        title="Lotti"
        description={`${total} lotti · storico fornitori, edicole e supermercati`}
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Registra Lotto
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
            placeholder="Cerca per fonte o note..."
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
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun lotto registrato</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Data</Th>
              <Th>Fonte</Th>
              <Th>Righe</Th>
              <Th>Costo extra</Th>
              <Th>Costo totale</Th>
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {purchases.map((p) => {
              const expanded = expandedId === p.id
              const rowCount = p.lines.reduce((acc, l) => acc + l.quantity, 0)
              return (
                <Fragment key={p.id}>
                  <Tr>
                    <Td className="text-xs text-[var(--ui-text-muted)]">
                      {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('it-IT') : '—'}
                    </Td>
                    <Td>
                      <p className="font-medium text-[var(--ui-text)]">{p.sourceName || '—'}</p>
                      <p className="text-xs text-[var(--ui-text-faint)]">{p.sourceType || ''}</p>
                    </Td>
                    <Td className="text-[var(--ui-text-muted)]">
                      {p.lines.length} riga{p.lines.length !== 1 ? 'e' : ''} · {rowCount} pezzi
                    </Td>
                    <Td className="text-[var(--ui-text-muted)]">{p.extraCosts ? euro.format(p.extraCosts) : '—'}</Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{p.totalCost != null ? euro.format(p.totalCost) : '—'}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpandedId(expanded ? null : p.id)}
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(p)}
                          disabled={busy}
                          title="Modifica lotto"
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
                          disabled={busy}
                          title="Elimina lotto"
                          className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                  {expanded ? (
                    <Tr key={`${p.id}-detail`}>
                      <Td colSpan={6} className="p-0">
                        <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]/40 px-4 py-3">
                          {p.lines.length === 0 ? (
                            <p className="text-sm text-[var(--ui-text-muted)]">Nessuna riga</p>
                          ) : (
                            <div className="divide-y divide-[var(--ui-border)]/80">
                              {p.lines.map((l, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--ui-text)]">{l.title}</span>
                                  <span className="text-xs text-[var(--ui-text-muted)]">qty {l.quantity}</span>
                                  <span className="text-xs text-[var(--ui-text-muted)]">costo {euro.format(l.unitCost)}</span>
                                  <span className="text-xs text-[var(--ui-text-faint)]">eff. {euro.format(l.effectiveUnitCost)}</span>
                                  <span className="text-xs text-[var(--ui-text-muted)]">residuo {l.remainingQuantity}</span>
                                </div>
                              ))}
                            </div>
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
            Pagina {page} di {totalPages} · {total} lotti
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

      {editing || showCreate ? (
        <Modal
          title={editing ? 'Modifica Lotto' : 'Registra Lotto'}
          onClose={resetForm}
          maxWidth="max-w-3xl"
          footer={
            <>
              <Button variant="secondary" onClick={resetForm}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} disabled={busy}>
                {busy ? 'Salvataggio...' : editing ? 'Salva Modifiche' : 'Registra e Carica in Inventario'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {modalError ? <Alert tone="danger">{modalError}</Alert> : null}

            <ModalSection title="Dati lotto">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data Acquisto *" htmlFor="pc-date">
                  <Input
                    id="pc-date"
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </Field>
                <Field label="Tipo di fonte" htmlFor="pc-source-type">
                  <Select
                    id="pc-source-type"
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
                  >
                    {SOURCE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Luogo / Fornitore" htmlFor="pc-source-name">
                  <Input
                    id="pc-source-name"
                    type="text"
                    list="pc-source-list"
                    value={form.sourceName}
                    onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                    placeholder="es. Esselunga Viale X"
                  />
                  <datalist id="pc-source-list">
                    {sourceOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Costi extra (€)" htmlFor="pc-extra">
                  <Input
                    id="pc-extra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.extraCosts}
                    onChange={(e) => setForm({ ...form, extraCosts: e.target.value })}
                    placeholder="spedizione / commissioni"
                  />
                </Field>
              </div>
            </ModalSection>

            <ModalSection
              title="Righe del lotto"
              action={
                <Button variant="secondary" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
                  <Plus className="h-3.5 w-3.5" /> Aggiungi riga
                </Button>
              }
            >
              <div className="space-y-3">
                {lines.map((line, index) => {
                  const lineGroup =
                    !line.newProduct && line.productId ? groupByProductId.get(line.productId) : undefined
                  return (
                    <div key={index} data-testid="purchase-line" className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)]/40 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <Select
                            data-testid="line-product"
                            value={line.newProduct ? '__new__' : (lineGroup?.title ?? '')}
                            onChange={(e) => {
                              const isNew = e.target.value === '__new__'
                              if (isNew) {
                                updateLine(index, { newProduct: true, productId: '' })
                                return
                              }
                              const group = groups.find((g) => g.title === e.target.value)
                              updateLine(index, {
                                newProduct: false,
                                productId: group ? String(group.products[0].id) : '',
                              })
                            }}
                          >
                            <option value="">— Seleziona prodotto esistente —</option>
                            {groups.map((g) => (
                              <option key={g.title} value={g.title}>{g.title}</option>
                            ))}
                            <option value="__new__">➕ Nuovo prodotto (crea dal lotto)</option>
                          </Select>

                          {lineGroup && lineGroup.products.length > 1 ? (
                            <Field label="Variante">
                              <Select
                                data-testid="line-variant"
                                value={line.productId}
                                onChange={(e) => updateLine(index, { productId: e.target.value })}
                              >
                                {buildVariantOptions(lineGroup.products).map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </Select>
                            </Field>
                          ) : null}

                        {line.newProduct ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="text"
                              value={line.newProductTitle}
                              onChange={(e) => updateLine(index, { newProductTitle: e.target.value })}
                              placeholder="Titolo nuovo prodotto *"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.newProductPrice}
                              onChange={(e) => updateLine(index, { newProductPrice: e.target.value })}
                              placeholder="Prezzo vendita (€)"
                            />
                            <Select
                              value={line.newProductCategory}
                              onChange={(e) => updateLine(index, { newProductCategory: e.target.value })}
                            >
                              <option value="">— Categoria —</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </Select>
                            <Select
                              value={line.newProductExpansion}
                              onChange={(e) => updateLine(index, { newProductExpansion: e.target.value })}
                            >
                              <option value="">— Espansione —</option>
                              {espansioni.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </Select>
                            <Select
                              value={line.newProductItemCategory1}
                              onChange={(e) =>
                                updateLine(index, {
                                  newProductItemCategory1: e.target.value,
                                  newProductItemCategory2: '',
                                })
                              }
                            >
                              <option value="product">Tipo: Prodotto</option>
                              <option value="card">Tipo: Carta</option>
                            </Select>
                            <Select
                              value={line.newProductItemCategory2}
                              onChange={(e) => updateLine(index, { newProductItemCategory2: e.target.value })}
                            >
                              <option value="">— Sottocategoria —</option>
                              {line.newProductItemCategory1 === 'card' ? (
                                <>
                                  <option value="single">SINGOLA</option>
                                  <option value="slab">SLAB</option>
                                  <option value="other">ALTRO</option>
                                </>
                              ) : (
                                <>
                                  <option value="spc">SPC</option>
                                  <option value="box">BOX</option>
                                  <option value="bundle">BUNDLE</option>
                                  <option value="etb">ETB</option>
                                  <option value="tin">TIN</option>
                                  <option value="other">ALTRO</option>
                                </>
                              )}
                            </Select>
                            <Input
                              type="url"
                              value={line.newProductImageLink}
                              onChange={(e) => updateLine(index, { newProductImageLink: e.target.value })}
                              placeholder="Image link (URL)"
                            />
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                        disabled={lines.length === 1}
                        className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Field label="Quantità *">
                        <Input
                          data-testid="line-quantity"
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                        />
                      </Field>
                      <Field label="Costo unitario (€) *">
                        <Input
                          data-testid="line-cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitCost}
                          onChange={(e) => updateLine(index, { unitCost: e.target.value })}
                          placeholder="0.00"
                        />
                      </Field>
                    </div>
                  </div>
                  )
                })}
              </div>
            </ModalSection>

            <ModalSection title="Note">
              <Textarea
                id="pc-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Note opzionali..."
              />
            </ModalSection>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
