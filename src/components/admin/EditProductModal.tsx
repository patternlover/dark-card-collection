'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Product {
  id: number
  title: string
  slug: string
  itemId: string
  description: string | null
  storePrice: number | null
  price: number | null
  compareAtPrice: number | null
  status: string
  condition: string
  language: string
  quantity: number
  imageUrl: string | null
  featured: boolean
  cardNumber: string | null
  rarity: string | null
  productState: string | null
  category: { id: number; name: string } | null
  collection: { id: number; name: string } | null
}

interface EditProductModalProps {
  product: Product
  password: string
  onClose: () => void
  onSaved: (updated: Product) => void
}

const STATUS_OPTIONS = [
  { value: 'listed', label: 'Disponibile' },
  { value: 'hold', label: 'In Attesa' },
  { value: 'sold', label: 'Venduto' },
]

const CONDITION_OPTIONS = [
  { value: 'mint', label: 'Mint' },
  { value: 'near-mint', label: 'Near Mint' },
  { value: 'lightly-played', label: 'Lightly Played' },
  { value: 'moderately-played', label: 'Moderately Played' },
  { value: 'heavily-played', label: 'Heavily Played' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'graded', label: 'Graded' },
]

const LANGUAGE_OPTIONS = [
  { value: 'italian', label: 'Italiano' },
  { value: 'english', label: 'Inglese' },
  { value: 'chinese', label: 'Cinese' },
  { value: 'japanese', label: 'Giapponese' },
]

export function EditProductModal({ product, password, onClose, onSaved }: EditProductModalProps) {
  const [form, setForm] = useState({
    title: product.title || '',
    slug: product.slug || '',
    itemId: product.itemId || '',
    description: product.description || '',
    storePrice: product.storePrice ?? '',
    status: product.status || 'listed',
    condition: product.condition || 'near-mint',
    language: product.language || 'italian',
    quantity: product.quantity ?? 1,
    imageUrl: product.imageUrl || '',
    featured: product.featured || false,
    cardNumber: product.cardNumber || '',
    rarity: product.rarity || '',
    productState: product.productState || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sheetSynced, setSheetSynced] = useState<boolean | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSheetSynced(null)

    const payload: Record<string, any> = {}
    payload.title = form.title
    payload.slug = form.slug
    payload.itemId = form.itemId
    payload.description = form.description || null
    payload.storePrice = form.storePrice === '' ? null : Number(form.storePrice)
    payload.status = form.status
    payload.condition = form.condition
    payload.language = form.language
    payload.quantity = Number(form.quantity)
    payload.imageUrl = form.imageUrl || null
    payload.featured = form.featured
    payload.cardNumber = form.cardNumber || null
    payload.rarity = form.rarity || null
    payload.productState = form.productState || null

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-password': password,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }

      const data = await res.json()
      setSheetSynced(data.sheetSynced ?? false)
      onSaved(data.product)
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-zinc-700 bg-zinc-950 p-6 shadow-[6px_6px_0px_0px_#27272a]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Modifica Prodotto</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-[#FACC15] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 border-2 border-red-800 bg-red-950 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {sheetSynced !== null && (
          <div className={`mb-4 border-2 p-3 text-sm font-medium ${
            sheetSynced ? 'border-green-700 bg-green-950 text-green-400' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
          }`}>
            {sheetSynced ? 'Google Sheet aggiornato' : 'Sheet non configurato — solo salvato localmente'}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Titolo *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Item ID</label>
              <input
                type="text"
                value={form.itemId}
                onChange={(e) => handleChange('itemId', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1 font-medium">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Prezzo Vendita (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.storePrice}
                onChange={(e) => handleChange('storePrice', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Product State</label>
              <input
                type="text"
                value={form.productState}
                onChange={(e) => handleChange('productState', e.target.value)}
                placeholder="AVAILABLE, HOLD, SOLD..."
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#FACC15] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Stato</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Condizione</label>
              <select
                value={form.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Lingua</label>
              <select
                value={form.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Quantita</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Card Number</label>
              <input
                type="text"
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => handleChange('featured', e.target.checked)}
                  className="h-4 w-4 border-2 border-zinc-600 bg-zinc-800 accent-[#FACC15]"
                />
                <span className="text-sm text-zinc-300 font-medium">In Evidenza</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1 font-medium">Image URL</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://product-images.s3.cardmarket.com/..."
              className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#FACC15] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1 font-medium">Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t-2 border-zinc-800">
          <button
            onClick={onClose}
            className="border-2 border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title}
            className="border-2 border-[#FACC15] bg-[#FACC15] px-6 py-2 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-0 disabled:hover:shadow-[3px_3px_0px_0px_#000]"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
