'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import {
  getEspansioni,
  getPurchases,
  getPurchaseSourceNames,
  createPurchase,
  deletePurchase,
  getCategoriesFull,
  updatePurchase,
  searchProducts,
  uploadReceipt,
  type CategoryDTO,
  type EspansioneOption,
  type PurchaseDTO,
  type ReceiptInput,
} from '@/app/dashboard/actions'
import { groupProducts, type ProductGroup } from '@/lib/group-products'
import { buildVariantOptions } from '@/lib/sale-options'
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  SortableTh,
  useSort,
  ModalSection,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Textarea,
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
  newProductExpansions: string[]
  newProductItemCategory1: string
  newProductItemCategory2: string
  newProductLanguage: string
  newProductGrade: string
  newProductCardNumber: string
  quantity: string
  unitCost: string
}

function emptyLine(): LineForm {
  return {
    productId: '',
    newProduct: false,
    newProductTitle: '',
    newProductPrice: '',
    newProductExpansions: [],
    newProductItemCategory1: 'product',
    newProductItemCategory2: '',
    newProductLanguage: 'italian',
    newProductGrade: 'near-mint',
    newProductCardNumber: '',
    quantity: '1',
    unitCost: '',
  }
}

function fmtPurchaseDate(value: string): string {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('it-IT')
}

function parseDateInput(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) return null
  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
}

export function PurchasesSection({ initialSearch = '' }: { initialSearch?: string }) {
  const [purchases, setPurchases] = useState<PurchaseDTO[]>([])
  const { sortBy, sortDir, handleSort } = useSort('purchaseDate')
  const onSort = (field: string) => {
    setPage(1)
    handleSort(field)
  }
  const [query, setQuery] = useState(initialSearch)
  const [appliedQuery, setAppliedQuery] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [espansioni, setEspansioni] = useState<EspansioneOption[]>([])
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<PurchaseDTO | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    purchaseDate: new Date().toLocaleDateString('it-IT'),
    sourceType: '',
    sourceName: '',
    extraCosts: '',
    notes: '',
  })
  const [receipt, setReceipt] = useState<ReceiptInput | null>(null)
  const [receiptBusy, setReceiptBusy] = useState(false)
  const [receiptDrag, setReceiptDrag] = useState(false)
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
          search: appliedQuery,
          sortBy,
          sortDir,
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
    [appliedQuery, sortBy, sortDir, page],
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
    getEspansioni().then(setEspansioni).catch(() => {})
    getCategoriesFull().then(setCategories).catch(() => {})
    getPurchaseSourceNames().then(setSourceOptions).catch(() => {})
    refreshProductOptions()
  }, [refreshProductOptions])

  useEffect(() => {
    load()
  }, [load])

  const notify = (text: string, type: 'success' | 'error' = 'success') => setMessage({ text, type })

  const updateLine = (index: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const handleReceiptFile = async (file: File | undefined | null) => {
    if (!file) return
    if (!/^(image\/|application\/pdf)/.test(file.type)) {
      setModalError('Scontrino: accetta solo immagini o PDF')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setModalError('Scontrino: file troppo grande (max 10 MB)')
      return
    }
    setReceiptBusy(true)
    setModalError(null)
    try {
      const res = await uploadReceipt(file)
      if (!res.ok) {
        setModalError(res.message ?? 'Errore durante l\'upload dello scontrino')
        return
      }
      setReceipt(res.receipt ?? null)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : String(err))
    } finally {
      setReceiptBusy(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setModalError(null)
    getPurchaseSourceNames().then(setSourceOptions).catch(() => {})
    refreshProductOptions()
    setForm({
      purchaseDate: new Date().toLocaleDateString('it-IT'),
      sourceType: '',
      sourceName: '',
      extraCosts: '',
      notes: '',
    })
    setReceipt(null)
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
      purchaseDate: p.purchaseDate ? fmtPurchaseDate(p.purchaseDate) : new Date().toLocaleDateString('it-IT'),
      sourceType: p.sourceType || '',
      sourceName: p.sourceName || '',
      extraCosts: p.extraCosts != null ? String(p.extraCosts) : '',
      notes: p.notes || '',
    })
    setReceipt(p.receipt ?? null)
    setLines(
      p.lines.length > 0
        ? p.lines.map((l) => ({
            productId: l.productId,
            newProduct: false,
            newProductTitle: '',
            newProductPrice: '',
            newProductExpansions: [],
            newProductItemCategory1: 'product',
            newProductItemCategory2: '',
            newProductLanguage: 'italian',
            newProductGrade: 'near-mint',
            newProductCardNumber: '',
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
      purchaseDate: new Date().toLocaleDateString('it-IT'),
      sourceType: '',
      sourceName: '',
      extraCosts: '',
      notes: '',
    })
    setReceipt(null)
    setLines([emptyLine()])
  }

  const handleSubmit = async () => {
    const isoDate = parseDateInput(form.purchaseDate)
    if (!isoDate) {
      setModalError('Data non valida: usa il formato GG/MM/AAAA')
      return
    }
    const lineInputs = lines.map((l) => ({
      productId: l.newProduct ? null : l.productId || null,
      newProductTitle: l.newProduct ? l.newProductTitle.trim() || null : null,
      newProductPrice: l.newProduct && l.newProductPrice ? Number(l.newProductPrice) : null,
      newProductExpansions: l.newProduct ? l.newProductExpansions : undefined,
      newProductItemCategory1: l.newProduct ? l.newProductItemCategory1 || 'product' : undefined,
      newProductItemCategory2: l.newProduct ? l.newProductItemCategory2 || undefined : undefined,
      newProductLanguage: l.newProduct ? l.newProductLanguage || 'italian' : undefined,
      newProductGrade: l.newProduct ? l.newProductGrade || 'near-mint' : undefined,
      newProductCardNumber: l.newProduct ? l.newProductCardNumber.trim() || null : null,
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
        purchaseDate: isoDate,
        sourceType: form.sourceType || undefined,
        sourceName: form.sourceName.trim() || undefined,
        extraCosts: form.extraCosts ? Number(form.extraCosts) : undefined,
        receipt,
        notes: form.notes.trim() || undefined,
        lines: lineInputs,
      }
      if (editing) {
        const res = await updatePurchase(editing.id, data)
        if (!res.ok) {
          setModalError(res.message)
          return
        }
        notify('Lotto aggiornato e magazzino riconciliato')
      } else {
        const res = await createPurchase(data)
        if (!res.ok) {
          setModalError(res.message)
          return
        }
        notify('Lotto registrato e magazzino aggiornato con successo')
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

      <div className="flex justify-end">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedQuery(query.trim())
                setPage(1)
              }
            }}
            placeholder="Cerca per fonte o note..."
            className="pl-9"
          />
        </div>
      </div>

      {message ? <Alert tone={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert> : null}

      {loading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento...</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Nessun lotto registrato</p>
      ) : (
        <Table>
          <THead>
            <Tr>
              <SortableTh label="Data" field="purchaseDate" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh label="Fonte" field="sourceName" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <Th>Qty</Th>
              <Th>Costo extra</Th>
              <SortableTh label="Costo totale" field="totalCost" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <Th className="text-right">Azioni</Th>
            </Tr>
          </THead>
          <TBody>
            {purchases.map((p) => {
              const expanded = expandedId === p.id
              const rowCount = p.lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0)
              return (
                <Fragment key={p.id}>
                  <Tr>
                    <Td>
                      <button
                        onClick={() => setExpandedId(expanded ? null : p.id)}
                        className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
                      >
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[var(--ui-text-faint)] transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                        {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('it-IT') : '—'}
                      </button>
                    </Td>
                    <Td>
                      <p className="font-medium text-[var(--ui-text)]">{p.sourceName || '—'}</p>
                    </Td>
                    <Td className="text-[var(--ui-text-muted)]">{rowCount}</Td>
                    <Td className="text-[var(--ui-text-muted)]">{p.extraCosts ? euro.format(p.extraCosts) : '—'}</Td>
                    <Td className="font-semibold text-[var(--ui-text)]">{p.totalCost != null ? euro.format(p.totalCost) : '—'}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                          disabled={busy}
                          title="Modifica lotto"
                          className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
                          disabled={busy}
                          title="Elimina lotto"
                          className="p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
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
                {busy ? 'Salvataggio...' : editing ? 'Salva Modifiche' : 'Registra e Carica in Magazzino'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {modalError ? <Alert tone="danger">{modalError}</Alert> : null}

            <ModalSection title="Dati lotto">
              <div className="space-y-4">
                <Field label="Data Acquisto *" htmlFor="pc-date">
                  <Input
                    id="pc-date"
                    type="text"
                    inputMode="numeric"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: formatDateInput(e.target.value) })}
                    placeholder="GG/MM/AAAA"
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

                <div className="space-y-3">
                  <Field label="Scontrino">
                    <div
                      data-testid="receipt-dropzone"
                      onDragOver={(e) => {
                        e.preventDefault()
                        setReceiptDrag(true)
                      }}
                      onDragLeave={() => setReceiptDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setReceiptDrag(false)
                        handleReceiptFile(e.dataTransfer.files?.[0])
                      }}
                      className={`flex min-h-[3rem] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed px-3 py-2 transition-colors ${
                        receiptDrag
                          ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]/10'
                          : 'border-[var(--ui-border-strong)] bg-[var(--ui-bg)]/40'
                      }`}
                    >
                      {receiptBusy ? (
                        <p className="text-sm text-[var(--ui-text-muted)]">Caricamento su Google Drive...</p>
                      ) : receipt ? (
                        <div className="flex w-full min-w-0 items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                            <span className="truncate text-sm font-medium text-[var(--ui-text)]">{receipt.name}</span>
                            {receipt.url ? (
                              <a
                                href={receipt.url}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-xs text-[var(--ui-accent)] hover:underline"
                              >
                                Apri su Drive
                              </a>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReceipt(null)}
                            title="Rimuovi scontrino"
                            className="shrink-0 p-1.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor="pc-receipt" className="flex w-full cursor-pointer items-center justify-center gap-2 py-1 text-sm text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]">
                          <Upload className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 truncate">
                            Trascina lo scontrino qui o <span className="text-[var(--ui-accent)] underline-offset-2 hover:underline">sfoglia</span>
                          </span>
                          <input
                            id="pc-receipt"
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              handleReceiptFile(e.target.files?.[0])
                              e.target.value = ''
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </Field>

                  <Field label="Note">
                    <Textarea
                      id="pc-notes"
                      rows={1}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Note opzionali..."
                      className="min-h-[3rem]"
                    />
                  </Field>
                </div>
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
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
                          Riga {index + 1}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                          disabled={lines.length === 1}
                          title="Rimuovi riga"
                          className="p-1 text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <Select
                            data-testid="line-product"
                            value={
                              line.newProduct
                                ? line.newProductItemCategory1 === 'card'
                                  ? '__new_card__'
                                  : '__new__'
                                : (lineGroup?.title ?? '')
                            }
                            onChange={(e) => {
                              const isNew = e.target.value === '__new__' || e.target.value === '__new_card__'
                              if (isNew) {
                                const isCard = e.target.value === '__new_card__'
                                updateLine(index, {
                                  newProduct: true,
                                  productId: '',
                                  newProductItemCategory1: isCard ? 'card' : 'product',
                                  newProductItemCategory2: '',
                                  newProductGrade: 'near-mint',
                                  newProductCardNumber: '',
                                })
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
                            <optgroup label="Nuovo articolo">
                              <option value="__new__">➕ Nuovo prodotto</option>
                              <option value="__new_card__">➕ Nuova carta</option>
                            </optgroup>
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
                          <div className="space-y-2">
                            <Field label="Titolo *">
                              <Input
                                type="text"
                                value={line.newProductTitle}
                                onChange={(e) => updateLine(index, { newProductTitle: e.target.value })}
                                placeholder="Titolo nuovo prodotto"
                              />
                            </Field>
                            <Field label="Prezzo vendita (€)">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.newProductPrice}
                                onChange={(e) => updateLine(index, { newProductPrice: e.target.value })}
                                placeholder="0.00"
                              />
                            </Field>
                            <Field label="Espansioni">
                              <Select
                                multiple
                                value={line.newProductExpansions}
                                onChange={(e) =>
                                  updateLine(index, {
                                    newProductExpansions: Array.from(e.target.selectedOptions).map((o) => o.value),
                                  })
                                }
                              >
                                {espansioni.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </Select>
                            </Field>
                            <Field label="Categoria">
                              <Select
                                value={line.newProductItemCategory2}
                                onChange={(e) => updateLine(index, { newProductItemCategory2: e.target.value })}
                              >
                                <option value="">— Categoria —</option>
                                {categories
                                  .filter((c) => c.kind === 'both' || c.kind === line.newProductItemCategory1)
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                              </Select>
                            </Field>
                            <Field label="Lingua">
                              <Select
                                value={line.newProductLanguage}
                                onChange={(e) => updateLine(index, { newProductLanguage: e.target.value })}
                              >
                                <option value="italian">Italiano</option>
                                <option value="english">Inglese</option>
                                <option value="chinese">Cinese</option>
                                <option value="japanese">Giapponese</option>
                              </Select>
                            </Field>
                            {line.newProductItemCategory1 === 'card' ? (
                              <>
                                <Field label="Grado">
                                  <Select
                                    value={line.newProductGrade}
                                    onChange={(e) => updateLine(index, { newProductGrade: e.target.value })}
                                  >
                                    <option value="mint">Mint</option>
                                    <option value="near-mint">Near Mint</option>
                                    <option value="lightly-played">Lightly Played</option>
                                    <option value="moderately-played">Moderately Played</option>
                                    <option value="heavily-played">Heavily Played</option>
                                    <option value="damaged">Damaged</option>
                                    <option value="graded">Graded</option>
                                  </Select>
                                </Field>
                                <Field label="Card Number">
                                  <Input
                                    type="text"
                                    value={line.newProductCardNumber}
                                    onChange={(e) => updateLine(index, { newProductCardNumber: e.target.value })}
                                    placeholder="Card Number"
                                  />
                                </Field>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
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
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
