'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { getProductImageInfo } from '@/lib/product-image'
import { proxyImageUrl } from '@/lib/proxy-image'
import type { ProductGroup } from '@/lib/group-products'
import type { CategoryOption, CollectionOption, ProductDTO } from '@/app/dashboard/actions'
import { deleteProduct, updateProduct } from '@/app/dashboard/actions'
import { EditProductModal } from './EditProductModal'

const STATUS_LABELS: Record<string, string> = {
  listed: 'Disponibile',
  hold: 'In Attesa',
  sold: 'Venduto',
}

const STATUS_BADGES: Record<string, string> = {
  listed: 'bg-green-500/10 text-green-400 border-green-500/40',
  hold: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  sold: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/40',
}

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Mint',
  'near-mint': 'NM',
  'lightly-played': 'LP',
  'moderately-played': 'MP',
  'heavily-played': 'HP',
  damaged: 'Damaged',
  graded: 'Graded',
}

const LANGUAGE_LABELS: Record<string, string> = {
  italian: 'IT',
  english: 'EN',
  chinese: 'CN',
  japanese: 'JP',
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

interface ProductGroupRowProps {
  group: ProductGroup
  categories: CategoryOption[]
  collections: CollectionOption[]
  onChanged: () => void
  onNotify: (msg: string, type: 'success' | 'error') => void
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGES[status] || STATUS_BADGES.sold
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function VariantThumb({ product }: { product: any }) {
  const info = getProductImageInfo(product)
  const src = proxyImageUrl(info.cardUrl || info.url)
  if (!src) return <div className="h-12 w-9 shrink-0 rounded border border-zinc-700 bg-zinc-800" />
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-12 w-9 shrink-0 rounded border border-zinc-700 bg-zinc-800 object-cover"
    />
  )
}

export function ProductGroupRow({
  group,
  categories,
  collections,
  onChanged,
  onNotify,
}: ProductGroupRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const anyVisible = group.products.some((p) => p.isVisible !== false)
  const statuses = Array.from(new Set(group.products.map((p) => p.status || 'listed')))
  const firstItemId = group.products.find((p) => p.itemId)?.itemId || ''
  const categoryName = group.category?.name || ''
  const collectionName = group.collection?.name || ''

  const toggleVisible = async () => {
    setBusy(true)
    try {
      await Promise.all(
        group.products.map((p) => updateProduct(String(p.id), { isVisible: !anyVisible })),
      )
      onChanged()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteGroup = async () => {
    if (!confirm(`Eliminare definitivamente "${group.title}" (${group.variantCount} varianti)?`)) return
    setBusy(true)
    try {
      await Promise.all(group.products.map((p) => deleteProduct(String(p.id))))
      onNotify(`"${group.title}" eliminato`, 'success')
      onChanged()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteVariant = async (id: string) => {
    if (!confirm('Eliminare definitivamente questa variante?')) return
    setBusy(true)
    try {
      await deleteProduct(id)
      onNotify('Variante eliminata', 'success')
      onChanged()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const groupThumb = proxyImageUrl(group.imageCard || group.image)

  return (
    <div className="rounded-xl border-2 border-zinc-800 bg-zinc-900/40">
      <div className="flex flex-wrap items-center gap-4 p-4">
        {groupThumb ? (
          <img
            src={groupThumb}
            alt={group.title}
            loading="lazy"
            className="h-16 w-12 shrink-0 rounded-lg border-2 border-zinc-700 bg-zinc-800 object-cover"
          />
        ) : (
          <div className="h-16 w-12 shrink-0 rounded-lg border-2 border-zinc-700 bg-zinc-800" />
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-bold text-white hover:text-[var(--accent)]">{group.title}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {[firstItemId, categoryName, collectionName].filter(Boolean).join(' · ') || '—'}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {statuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
            <span className="inline-block rounded border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
              {group.variantCount} varianti
            </span>
          </div>
        </button>

        <div className="ml-auto flex flex-col items-end gap-1 text-right">
          <p className="text-sm font-black text-white">
            {group.sellingPrice > 0 ? (
              <>
                <span className="text-[10px] font-bold uppercase text-zinc-500">da </span>
                {euro.format(group.sellingPrice)}
              </>
            ) : (
              <span className="text-xs text-zinc-500">N/D</span>
            )}
          </p>
          <p className="text-xs text-zinc-500">qty: {group.totalQuantity}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleVisible}
            disabled={busy}
            title={anyVisible ? 'Nascondi dallo shop' : 'Mostra nello shop'}
            className="rounded-lg border-2 border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
          >
            {anyVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setEditingVariant(group.products[0] as unknown as ProductDTO)}
            disabled={busy}
            title="Modifica"
            className="rounded-lg border-2 border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={deleteGroup}
            disabled={busy}
            title="Elimina gruppo"
            className="rounded-lg border-2 border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border-2 border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t-2 border-zinc-800">
          <div className="divide-y divide-zinc-800/80">
            {group.products.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <VariantThumb product={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{p.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {[
                      p.language ? (LANGUAGE_LABELS[p.language] || p.language) : null,
                      p.condition ? (CONDITION_LABELS[p.condition] || p.condition) : null,
                      p.itemId ? `ID ${p.itemId}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <p className="text-sm font-bold text-white">{euro.format(p.storePrice ?? 0)}</p>
                <p className="w-10 text-right text-xs text-zinc-500">qty {p.quantity ?? 0}</p>
                <StatusBadge status={p.status || 'listed'} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingVariant(p as unknown as ProductDTO)}
                    disabled={busy}
                    title="Modifica variante"
                    className="rounded-lg border-2 border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteVariant(String(p.id))}
                    disabled={busy}
                    title="Elimina variante"
                    className="rounded-lg border-2 border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
          onSaved={() => {
            setEditingVariant(null)
            onNotify('Prodotto salvato', 'success')
            onChanged()
          }}
          onError={(msg) => onNotify(msg, 'error')}
        />
      )}
    </div>
  )
}
