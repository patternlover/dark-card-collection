'use client'

import { useState } from 'react'
import type {
  CategoryOption,
  EspansioneOption,
  ProductDTO,
  UpdateProductPatch,
} from '@/app/dashboard/actions'
import { updateProduct } from '@/app/dashboard/actions'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'

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

const ITEM_CATEGORY_OPTIONS = [
  { value: 'product', label: 'Prodotto' },
  { value: 'card', label: 'Carta' },
]

interface EditProductModalProps {
  product: ProductDTO
  categories: CategoryOption[]
  espansioni: EspansioneOption[]
  onClose: () => void
  onSaved: (saved: ProductDTO) => void
  onError: (msg: string) => void
}

export function EditProductModal({
  product,
  categories,
  espansioni,
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
    expansion: product.expansion?.id ? String(product.expansion.id) : '',
    cardNumber: product.cardNumber || '',
    rarity: product.rarity || '',
    quantity: product.quantity != null ? String(product.quantity) : '1',
    imageLink: product.imageLink || '',
    featured: product.featured ?? false,
    isVisible: product.isVisible ?? true,
    itemCategory: product.itemCategory || 'product',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemCategory = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, itemCategory: value }
      if (value === 'card') {
        next.productType = ''
        next.googleProductCategory = ''
        next.isPreorder = false
      } else {
        next.grade = 'near-mint'
        next.condition = 'new'
        next.language = 'italian'
        next.cardNumber = ''
        next.rarity = ''
      }
      return next
    })
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
        isPreorder: form.itemCategory === 'product' ? form.isPreorder : false,
        grade: form.itemCategory === 'card' ? form.grade : 'near-mint',
        condition: form.itemCategory === 'card' ? form.condition : 'new',
        productType: form.itemCategory === 'product' ? (form.productType.trim() || null) : null,
        googleProductCategory:
          form.itemCategory === 'product' ? (form.googleProductCategory.trim() || null) : null,
        language: form.itemCategory === 'card' ? form.language : 'italian',
        category: form.category ? Number(form.category) : null,
        expansion: form.expansion ? Number(form.expansion) : null,
        cardNumber: form.itemCategory === 'card' ? (form.cardNumber.trim() || null) : null,
        rarity: form.itemCategory === 'card' ? (form.rarity || null) : null,
        quantity: Number(form.quantity) || 0,
        imageLink: form.imageLink.trim() || null,
        featured: form.featured,
        isVisible: form.isVisible,
        itemCategory: form.itemCategory,
      }
      const saved = await updateProduct(product.id, patch)
      onSaved(saved)
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const checkboxClass = 'h-4 w-4 accent-[var(--ui-accent)]'
  const isCard = form.itemCategory === 'card'
  const isProduct = form.itemCategory === 'product'

  return (
    <Modal
      title="Modifica Prodotto"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Titolo *" htmlFor="ep-title">
            <Input
              id="ep-title"
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </Field>
          <Field label="Tipo articolo" htmlFor="ep-item-category">
            <Select
              id="ep-item-category"
              value={form.itemCategory}
              onChange={(e) => handleItemCategory(e.target.value)}
            >
              {ITEM_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Item Group ID" htmlFor="ep-item-group">
            <Input
              id="ep-item-group"
              type="text"
              value={form.itemGroupId}
              onChange={(e) => handleChange('itemGroupId', e.target.value)}
            />
          </Field>
          <Field label="Slug" htmlFor="ep-slug">
            <Input
              id="ep-slug"
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Disponibilità" htmlFor="ep-availability">
            <Select
              id="ep-availability"
              value={form.availability}
              onChange={(e) => handleChange('availability', e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Stato" htmlFor="ep-status">
            <Select
              id="ep-status"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Prezzo Vendita (€)" htmlFor="ep-price">
            <Input
              id="ep-price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
          </Field>
          <Field label="Costo Acquisto (€)" htmlFor="ep-cogs">
            <Input
              id="ep-cogs"
              type="number"
              step="0.01"
              min="0"
              value={form.costOfGoodsSold}
              onChange={(e) => handleChange('costOfGoodsSold', e.target.value)}
            />
          </Field>
          <Field label="Prezzo Barrato (€)" htmlFor="ep-sale-price">
            <Input
              id="ep-sale-price"
              type="number"
              step="0.01"
              min="0"
              value={form.salePrice}
              onChange={(e) => handleChange('salePrice', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Quantità" htmlFor="ep-quantity">
            <Input
              id="ep-quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
          </Field>
          <Field label="Categoria" htmlFor="ep-category">
            <Select
              id="ep-category"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Espansione" htmlFor="ep-expansion">
            <Select
              id="ep-expansion"
              value={form.expansion}
              onChange={(e) => handleChange('expansion', e.target.value)}
            >
              <option value="">—</option>
              {espansioni.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        {isCard ? (
          <div className="space-y-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
              Dettagli carta
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Condizione / Grado" htmlFor="ep-grade">
                <Select
                  id="ep-grade"
                  value={form.grade}
                  onChange={(e) => handleChange('grade', e.target.value)}
                >
                  {GRADE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Condizione (Google)" htmlFor="ep-condition">
                <Select
                  id="ep-condition"
                  value={form.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                >
                  {CONDITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Lingua" htmlFor="ep-language">
                <Select
                  id="ep-language"
                  value={form.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Card Number" htmlFor="ep-card-number">
                <Input
                  id="ep-card-number"
                  type="text"
                  value={form.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                />
              </Field>
              <Field label="Rarità" htmlFor="ep-rarity">
                <Select
                  id="ep-rarity"
                  value={form.rarity}
                  onChange={(e) => handleChange('rarity', e.target.value)}
                >
                  {RARITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        ) : null}

        {isProduct ? (
          <div className="space-y-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
              Dettagli prodotto
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Product Type (Google)" htmlFor="ep-product-type">
                <Input
                  id="ep-product-type"
                  type="text"
                  value={form.productType}
                  onChange={(e) => handleChange('productType', e.target.value)}
                  placeholder="es. Trading Card Game"
                />
              </Field>
              <Field label="Google Product Category" htmlFor="ep-gpc">
                <Input
                  id="ep-gpc"
                  type="text"
                  value={form.googleProductCategory}
                  onChange={(e) => handleChange('googleProductCategory', e.target.value)}
                  placeholder="es. Toys & Games > Trading Card Game Cards"
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPreorder}
                onChange={(e) => handleChange('isPreorder', e.target.checked)}
                className={checkboxClass}
              />
              <span className="text-sm font-medium text-[var(--ui-text-muted)]">Pre-Ordine</span>
            </label>
          </div>
        ) : null}

        <Field label="Image Link" htmlFor="ep-image-link">
          <Input
            id="ep-image-link"
            type="url"
            value={form.imageLink}
            onChange={(e) => handleChange('imageLink', e.target.value)}
            placeholder="https://..."
          />
        </Field>

        <Field label="Descrizione" htmlFor="ep-description">
          <Textarea
            id="ep-description"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => handleChange('featured', e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm font-medium text-[var(--ui-text-muted)]">In Evidenza</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => handleChange('isVisible', e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm font-medium text-[var(--ui-text-muted)]">Visibile nello shop</span>
          </label>
        </div>
      </div>
    </Modal>
  )
}
