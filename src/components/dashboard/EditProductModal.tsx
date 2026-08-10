'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type {
  CategoryOption,
  CollectionOption,
  ProductDTO,
  UpdateProductPatch,
} from '@/app/dashboard/actions'
import { updateProduct } from '@/app/dashboard/actions'

const STATUS_OPTIONS = [
  { value: 'listed', label: 'Disponibile' },
  { value: 'hold', label: 'In Attesa' },
  { value: 'sold', label: 'Venduto' },
]

const GRADE_OPTIONS = [
  { value: 'mint', label: 'Mint / Sigillato' },
  { value: 'near-mint', label: 'Near Mint' },
  { value: 'lightly-played', label: 'Lightly Played' },
  { value: 'moderately-played', label: 'Moderately Played' },
  { value: 'heavily-played', label: 'Heavily Played' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'graded', label: 'Graded' },
]

const CONDITION_OPTIONS = [
  { value: 'used', label: 'Usato' },
  { value: 'new', label: 'Nuovo' },
  { value: 'refurbished', label: 'Rigenerato' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'Disponibile' },
  { value: 'out_of_stock', label: 'Esaurito' },
  { value: 'preorder', label: 'Pre-Ordine' },
  { value: 'backorder', label: 'Backorder' },
]

const LANGUAGE_OPTIONS = [
  { value: 'italian', label: 'Italiano' },
  { value: 'english', label: 'Inglese' },
  { value: 'chinese', label: 'Cinese' },
  { value: 'japanese', label: 'Giapponese' },
]

const RARITY_OPTIONS = [
  { value: '', label: '—' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'rare-holo', label: 'Rare Holo' },
  { value: 'ultra-rare', label: 'Ultra Rare' },
  { value: 'secret-rare', label: 'Secret Rare' },
]

const inputClass =
  'w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[var(--accent)] focus:outline-none'
const labelClass = 'block text-xs text-zinc-500 mb-1 font-medium'

interface EditProductModalProps {
  product: ProductDTO
  categories: CategoryOption[]
  collections: CollectionOption[]
  onClose: () => void
  onSaved: (saved: ProductDTO) => void
  onError: (msg: string) => void
}

export function EditProductModal({
  product,
  categories,
  collections,
  onClose,
  onSaved,
  onError,
}: EditProductModalProps) {
  const [form, setForm] = useState({
    title: product.title || '',
    slug: product.slug || '',
    itemGroupId: product.itemGroupId || '',
    description: product.description || '',
    price: product.price != null ? String(product.price) : '',
    salePrice: product.salePrice != null ? String(product.salePrice) : '',
    costOfGoodsSold: product.costOfGoodsSold != null ? String(product.costOfGoodsSold) : '',
    status: product.status || 'listed',
    availability: product.availability || 'in_stock',
    isPreorder: product.isPreorder ?? false,
    grade: product.grade || 'near-mint',
    condition: product.condition || 'used',
    productType: product.productType || '',
    googleProductCategory: product.googleProductCategory || '',
    language: product.language || 'italian',
    category: product.category?.id ? String(product.category.id) : '',
    collection: product.collection?.id ? String(product.collection.id) : '',
    cardNumber: product.cardNumber || '',
    rarity: product.rarity || '',
    quantity: product.quantity != null ? String(product.quantity) : '1',
    imageLink: product.imageLink || '',
    featured: product.featured ?? false,
    isVisible: product.isVisible ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const patch: UpdateProductPatch = {
        title: form.title.trim() || product.title,
        slug: form.slug.trim(),
        itemGroupId: form.itemGroupId.trim() || null,
        description: form.description.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        salePrice: form.salePrice === '' ? null : Number(form.salePrice),
        costOfGoodsSold: form.costOfGoodsSold === '' ? null : Number(form.costOfGoodsSold),
        status: form.status,
        availability: form.availability,
        isPreorder: form.isPreorder,
        grade: form.grade,
        condition: form.condition,
        productType: form.productType.trim() || null,
        googleProductCategory: form.googleProductCategory.trim() || null,
        language: form.language,
        category: form.category ? Number(form.category) : null,
        collection: form.collection ? Number(form.collection) : null,
        cardNumber: form.cardNumber.trim() || null,
        rarity: form.rarity || null,
        quantity: Number(form.quantity) || 0,
        imageLink: form.imageLink.trim() || null,
        featured: form.featured,
        isVisible: form.isVisible,
      }
      const saved = await updateProduct(product.id, patch)
      onSaved(saved)
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border-2 border-zinc-700 bg-zinc-950 p-6 shadow-[6px_6px_0px_0px_#27272a]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Modifica Prodotto</h2>
          <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-[var(--accent)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Titolo *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Item Group ID</label>
              <input
                type="text"
                value={form.itemGroupId}
                onChange={(e) => handleChange('itemGroupId', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Disponibilità</label>
              <select
                value={form.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
                className={inputClass}
              >
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Prezzo Vendita (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Costo Acquisto (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costOfGoodsSold}
                onChange={(e) => handleChange('costOfGoodsSold', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prezzo Barrato (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => handleChange('salePrice', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Stato</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Grado</label>
              <select
                value={form.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                className={inputClass}
              >
                {GRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Condizione</label>
              <select
                value={form.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className={inputClass}
              >
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Lingua</label>
              <select
                value={form.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className={inputClass}
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Quantità</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Card Number</label>
              <input
                type="text"
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Rarità</label>
              <select
                value={form.rarity}
                onChange={(e) => handleChange('rarity', e.target.value)}
                className={inputClass}
              >
                {RARITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Product Type (Google)</label>
              <input
                type="text"
                value={form.productType}
                onChange={(e) => handleChange('productType', e.target.value)}
                placeholder="es. Trading Card Game"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Google Product Category</label>
              <input
                type="text"
                value={form.googleProductCategory}
                onChange={(e) => handleChange('googleProductCategory', e.target.value)}
                placeholder="es. Toys & Games > Trading Card Game Cards"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Collezione</label>
              <select
                value={form.collection}
                onChange={(e) => handleChange('collection', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Image Link</label>
            <input
              type="url"
              value={form.imageLink}
              onChange={(e) => handleChange('imageLink', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-sm font-medium text-zinc-300">In Evidenza</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPreorder}
                onChange={(e) => handleChange('isPreorder', e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-sm font-medium text-zinc-300">Pre-Ordine</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => handleChange('isVisible', e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-sm font-medium text-zinc-300">Visibile nello shop</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t-2 border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)] px-6 py-2 text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
