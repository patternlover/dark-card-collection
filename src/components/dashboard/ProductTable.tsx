'use client'

import { useState } from 'react'
import { ChevronDown, Copy, Eye, EyeOff, Pencil, ShoppingBag, Trash2 } from 'lucide-react'
import type { ProductGroup } from '@/lib/group-products'
import type { CategoryOption, CollectionOption, ProductDTO } from '@/app/dashboard/actions'
import { deleteProduct, updateProduct } from '@/app/dashboard/actions'
import { EditProductModal } from './EditProductModal'
import { CreateProductModal } from './CreateProductModal'
import { ExternalSaleModal } from './ExternalSaleModal'
import { GRADE_LABELS, LANGUAGE_LABELS, StatusBadge } from './productShared'
import { Button, Table, TBody, Td, Th, THead, Tr } from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

interface ProductTableProps {
  groups: ProductGroup[]
  categories: CategoryOption[]
  collections: CollectionOption[]
  onPatch: (id: string, patch: Partial<ProductDTO>) => void
  onRemove: (ids: string[]) => void
  onChanged: () => void
  onNotify: (msg: string, type: 'success' | 'error') => void
}

function rowButtonClass(danger = false) {
  return `rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors ${
    danger ? 'hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]' : 'hover:text-[var(--ui-text)]'
  }`
}

export function ProductTable({
  groups,
  categories,
  collections,
  onPatch,
  onRemove,
  onChanged,
  onNotify,
}: ProductTableProps) {
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductDTO | null>(null)
  const [duplicatingVariant, setDuplicatingVariant] = useState<ProductDTO | null>(null)
  const [externalSaleProduct, setExternalSaleProduct] = useState<ProductDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const toggleVisible = async (group: ProductGroup) => {
    const anyVisible = group.products.some((p) => p.isVisible !== false)
    const target = !anyVisible
    for (const p of group.products) onPatch(String(p.id), { isVisible: target })
    setBusy(true)
    try {
      await Promise.all(
        group.products.map((p) => updateProduct(String(p.id), { isVisible: target })),
      )
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err), 'error')
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const deleteGroup = async (group: ProductGroup) => {
    if (!confirm(`Eliminare definitivamente "${group.title}" (${group.variantCount} lotti)?`)) return
    setBusy(true)
    try {
      onRemove(group.products.map((p) => String(p.id)))
      await Promise.all(group.products.map((p) => deleteProduct(String(p.id))))
      onNotify(`"${group.title}" eliminato`, 'success')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err), 'error')
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const deleteVariant = async (id: string) => {
    if (!confirm('Eliminare definitivamente questo lotto?')) return
    setBusy(true)
    try {
      onRemove([id])
      await deleteProduct(id)
      onNotify('Variante eliminata', 'success')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err), 'error')
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Table>
        <THead>
          <Tr>
            <Th>Prodotto</Th>
            <Th>Item Group</Th>
            <Th>Stato</Th>
            <Th>Prezzo</Th>
            <Th>Qty</Th>
            <Th>Lotti</Th>
            <Th className="text-right">Azioni</Th>
          </Tr>
        </THead>
        <TBody>
          {groups.map((group) => {
            const expanded = expandedTitle === group.title
            const anyVisible = group.products.some((p) => p.isVisible !== false)
            const statuses = Array.from(new Set(group.products.map((p) => p.status || 'listed')))
            const firstItemGroupId =
              group.products.find((p) => p.itemGroupId)?.itemGroupId || ''

            return (
                <GroupRows
                  key={group.title}
                  group={group}
                  expanded={expanded}
                  anyVisible={anyVisible}
                  statuses={statuses}
                  firstItemGroupId={firstItemGroupId}
                  busy={busy}
                  onToggle={() => setExpandedTitle(expanded ? null : group.title)}
                  onToggleVisible={() => toggleVisible(group)}
                  onDeleteGroup={() => deleteGroup(group)}
                  onEditVariant={(p) => setEditingVariant(p)}
                  onDuplicateVariant={(p) => setDuplicatingVariant(p)}
                  onExternalSale={(p) => setExternalSaleProduct(p)}
                  onDeleteVariant={(id) => deleteVariant(id)}
                />
            )
          })}
        </TBody>
      </Table>
      {editingVariant ? (
        <EditProductModal
          product={editingVariant}
          categories={categories}
          collections={collections}
          onClose={() => setEditingVariant(null)}
          onSaved={(saved) => {
            onPatch(String(saved.id), saved)
            setEditingVariant(null)
            onNotify('Prodotto salvato', 'success')
          }}
          onError={(msg) => onNotify(msg, 'error')}
        />
      ) : null}
      {duplicatingVariant ? (
        <CreateProductModal
          initialProduct={duplicatingVariant}
          categories={categories}
          collections={collections}
          onClose={() => setDuplicatingVariant(null)}
          onCreated={() => {
            setDuplicatingVariant(null)
            onNotify('Prodotto duplicato', 'success')
            onChanged()
          }}
          onError={(msg) => onNotify(msg, 'error')}
        />
      ) : null}
      {externalSaleProduct ? (
        <ExternalSaleModal
          product={externalSaleProduct}
          onClose={() => setExternalSaleProduct(null)}
          onSuccess={() => {
            setExternalSaleProduct(null)
            onNotify('Vendita esterna registrata con successo')
            onChanged()
          }}
          onError={(msg) => onNotify(msg, 'error')}
        />
      ) : null}
    </>
  )
}

function GroupRows({
  group,
  expanded,
  anyVisible,
  statuses,
  firstItemGroupId,
  busy,
  onToggle,
  onToggleVisible,
  onDeleteGroup,
  onEditVariant,
  onDuplicateVariant,
  onExternalSale,
  onDeleteVariant,
}: {
  group: ProductGroup
  expanded: boolean
  anyVisible: boolean
  statuses: string[]
  firstItemGroupId: string
  busy: boolean
  onToggle: () => void
  onToggleVisible: () => void
  onDeleteGroup: () => void
  onEditVariant: (p: ProductDTO) => void
  onDuplicateVariant: (p: ProductDTO) => void
  onExternalSale: (p: ProductDTO) => void
  onDeleteVariant: (id: string) => void
}) {
  return (
    <>
      <Tr onClick={onToggle}>
        <Td>
          <div className="flex items-center gap-3">
            <span className="max-w-[280px] truncate font-medium text-[var(--ui-text)]">
              {group.title}
            </span>
          </div>
        </Td>
        <Td>
          {firstItemGroupId ? (
            <span className="rounded border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] px-1.5 py-0.5 font-mono text-xs text-[var(--ui-text-muted)]">
              {firstItemGroupId}
            </span>
          ) : (
            <span className="text-[var(--ui-text-faint)]">—</span>
          )}
        </Td>
        <Td>
          <div className="flex flex-wrap gap-1">
            {statuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Td>
        <Td className="font-medium text-[var(--ui-text)]">
          {group.sellingPrice > 0 ? (
            <>
              <span className="mr-0.5 text-[10px] font-medium uppercase text-[var(--ui-text-faint)]">da</span>
              {euro.format(group.sellingPrice)}
            </>
          ) : (
            <span className="text-xs text-[var(--ui-text-faint)]">N/D</span>
          )}
        </Td>
        <Td className="text-[var(--ui-text-muted)]">{group.totalQuantity}</Td>
        <Td className="text-[var(--ui-text-muted)]">{group.variantCount}</Td>
        <Td>
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisible()
              }}
              disabled={busy}
              title={anyVisible ? 'Nascondi dallo shop' : 'Mostra nello shop'}
              className={rowButtonClass()}
            >
              {anyVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEditVariant(group.products[0] as unknown as ProductDTO)
              }}
              disabled={busy}
              title="Modifica"
              className={rowButtonClass()}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteGroup()
              }}
              disabled={busy}
              title="Elimina gruppo"
              className={rowButtonClass(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <ChevronDown
              className={`h-4 w-4 text-[var(--ui-text-faint)] transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </Td>
      </Tr>
      {expanded ? (
        <Tr>
          <Td colSpan={7} className="p-0">
            <div className="border-t border-[var(--ui-border)]">
              <div className="divide-y divide-[var(--ui-border)]/80">
                {group.products.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 bg-[var(--ui-bg)]/40 px-4 py-3 pl-16">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{p.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                        {[
                          p.language ? (LANGUAGE_LABELS[p.language] || p.language) : null,
                          p.grade ? (GRADE_LABELS[p.grade] || p.grade) : null,
                          p.itemGroupId ? `ID ${p.itemGroupId}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[var(--ui-text)]">{euro.format(p.price ?? 0)}</p>
                    <p className="w-10 text-right text-xs text-[var(--ui-text-muted)]">qty {p.quantity ?? 0}</p>
                    <StatusBadge status={p.status || 'listed'} />
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEditVariant(p as unknown as ProductDTO)}
                        disabled={busy}
                        title="Modifica lotto"
                        className={rowButtonClass()}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDuplicateVariant(p as unknown as ProductDTO)}
                        disabled={busy}
                        title="Duplica lotto"
                        className={rowButtonClass()}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onExternalSale(p as unknown as ProductDTO)}
                        disabled={busy}
                        title="Registra vendita esterna (Vinted, Wallapop...)"
                        className={rowButtonClass()}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDeleteVariant(String(p.id))}
                        disabled={busy}
                        title="Elimina lotto"
                        className={rowButtonClass(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Td>
        </Tr>
      ) : null}
    </>
  )
}
