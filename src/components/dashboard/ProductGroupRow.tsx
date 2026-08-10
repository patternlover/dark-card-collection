'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Pencil, ShoppingBag, Trash2 } from 'lucide-react'
import { proxyImageUrl } from '@/lib/proxy-image'
import type { ProductGroup } from '@/lib/group-products'
import type { CategoryOption, CollectionOption, ProductDTO } from '@/app/dashboard/actions'
import { deleteProduct, updateProduct } from '@/app/dashboard/actions'
import { EditProductModal } from './EditProductModal'
import { CreateProductModal } from './CreateProductModal'
import { ExternalSaleModal } from './ExternalSaleModal'
import {
  GRADE_LABELS,
  LANGUAGE_LABELS,
  StatusBadge,
  VariantThumb,
} from './productShared'
import { Badge, Button, Card } from './ui'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

interface ProductGroupRowProps {
  group: ProductGroup
  categories: CategoryOption[]
  collections: CollectionOption[]
  onPatch: (id: string, patch: Partial<ProductDTO>) => void
  onRemove: (ids: string[]) => void
  onChanged: () => void
  onNotify: (msg: string, type: 'success' | 'error') => void
}

function iconButtonClass() {
  return 'rounded-md border border-[var(--ui-border-strong)] p-2 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]'
}

export function ProductGroupRow({
  group,
  categories,
  collections,
  onPatch,
  onRemove,
  onChanged,
  onNotify,
}: ProductGroupRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductDTO | null>(null)
  const [duplicatingVariant, setDuplicatingVariant] = useState<ProductDTO | null>(null)
  const [externalSaleProduct, setExternalSaleProduct] = useState<ProductDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const anyVisible = group.products.some((p) => p.isVisible !== false)
  const statuses = Array.from(new Set(group.products.map((p) => p.status || 'listed')))
  const firstItemGroupId = group.products.find((p) => p.itemGroupId)?.itemGroupId || ''

  const toggleVisible = async () => {
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

  const deleteGroup = async () => {
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

  const groupThumb = proxyImageUrl(group.imageCard || group.image)

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4 p-4">
        {groupThumb ? (
          <img
            src={groupThumb}
            alt={group.title}
            loading="lazy"
            className="h-16 w-12 shrink-0 rounded-md border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] object-cover"
          />
        ) : (
          <div className="h-16 w-12 shrink-0 rounded-md border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]" />
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-semibold text-[var(--ui-text)] transition-colors hover:text-[var(--ui-accent-hover)]">
            {group.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
            {firstItemGroupId ? `ID ${firstItemGroupId}` : '—'}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
            <Badge tone="neutral">{group.variantCount} lotti</Badge>
          </div>
        </button>

        <div className="ml-auto flex flex-col items-end gap-1 text-right">
          <p className="text-sm font-bold text-[var(--ui-text)]">
            {group.sellingPrice > 0 ? (
              <>
                <span className="text-[10px] font-medium uppercase text-[var(--ui-text-faint)]">da </span>
                {euro.format(group.sellingPrice)}
              </>
            ) : (
              <span className="text-xs text-[var(--ui-text-faint)]">N/D</span>
            )}
          </p>
          <p className="text-xs text-[var(--ui-text-muted)]">qty: {group.totalQuantity}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleVisible}
            disabled={busy}
            title={anyVisible ? 'Nascondi dallo shop' : 'Mostra nello shop'}
            className={iconButtonClass()}
          >
            {anyVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingVariant(group.products[0] as unknown as ProductDTO)}
            disabled={busy}
            title="Modifica"
            className={iconButtonClass()}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={deleteGroup}
            disabled={busy}
            title="Elimina gruppo"
            className="rounded-md border border-[var(--ui-border-strong)] p-2 text-[var(--ui-text-muted)] transition-colors hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className={iconButtonClass()}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--ui-border)]">
          <div className="divide-y divide-[var(--ui-border)]/80">
            {group.products.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <VariantThumb product={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{p.title}</p>
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
                <p className="text-sm font-semibold text-[var(--ui-text)]">{euro.format(p.price ?? 0)}</p>
                <p className="w-10 text-right text-xs text-[var(--ui-text-muted)]">qty {p.quantity ?? 0}</p>
                <StatusBadge status={p.status || 'listed'} />
                 <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingVariant(p as unknown as ProductDTO)}
                    disabled={busy}
                    title="Modifica lotto"
                    className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDuplicatingVariant(p as unknown as ProductDTO)}
                    disabled={busy}
                    title="Duplica lotto"
                    className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExternalSaleProduct(p as unknown as ProductDTO)}
                    disabled={busy}
                    title="Registra vendita esterna (Vinted, Wallapop...)"
                    className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => deleteVariant(String(p.id))}
                    disabled={busy}
                    title="Elimina lotto"
                    className="rounded-md border border-[var(--ui-border-strong)] p-1.5 text-[var(--ui-text-muted)] transition-colors hover:border-[var(--ui-danger)] hover:text-[var(--ui-danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingVariant && (
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
      )}
      {duplicatingVariant && (
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
      )}
      {externalSaleProduct && (
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
      )}
    </Card>
  )
}
