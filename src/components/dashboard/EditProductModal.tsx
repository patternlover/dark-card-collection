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

const PRODUCT_SUBCATEGORIES = [
  { value: 'spc', label: 'SPC' },
  { value: 'box', label: 'BOX' },
  { value: 'bundle', label: 'BUNDLE' },
  { value: 'etb', label: 'ETB' },
  { value: 'tin', label: 'TIN' },
  { value: 'other', label: 'ALTRO' },
]

const CARD_SUBCATEGORIES = [
  { value: 'single', label: 'SINGOLA' },
  { value: 'slab', label: 'SLAB' },
  { value: 'other', label: 'ALTRO' },
]

function AutoHint({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--ui-text-faint)]">
      <span className="rounded bg-[var(--ui-surface-alt)] px-1.5 py-0.5 font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
        Auto
      </span>
      {text}
    </span>
  )
}

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
    itemCategory1: product.itemCategory1 || 'product',
    itemCategory2: product.itemCategory2 || '',
    itemCategory3: product.itemCategory3 || '',
    showGoogle: Boolean(
      product.itemGroupId || product.productType || product.googleProductCategory,
    ),
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemCategory1 = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, itemCategory1: value, itemCategory2: '' }
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
        itemGroupId: form.showGoogle ? (form.itemGroupId.trim() || null) : null,
        description: form.description.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        salePrice: form.salePrice === '' ? null : Number(form.salePrice),
        status: form.status,
        availability: form.availability,
        isPreorder: form.itemCategory1 === 'product' ? form.isPreorder : false,
        grade: form.itemCategory1 === 'card' ? form.grade : 'near-mint',
        condition: form.itemCategory1 === 'card' ? form.condition : 'new',
        productType: form.showGoogle
          ? form.itemCategory1 === 'product'
            ? (form.productType.trim() || null)
            : null
          : null,
        googleProductCategory: form.showGoogle
          ? (form.googleProductCategory.trim() || null)
          : null,
        language: form.itemCategory1 === 'card' ? form.language : 'italian',
        category: form.category ? Number(form.category) : null,
        expansion: form.expansion ? Number(form.expansion) : null,
        cardNumber: form.itemCategory1 === 'card' ? (form.cardNumber.trim() || null) : null,
        rarity: form.itemCategory1 === 'card' ? (form.rarity || null) : null,
        quantity: Number(form.quantity) || 0,
        imageLink: form.imageLink.trim() || null,
        itemCategory1: form.itemCategory1,
        itemCategory2: form.itemCategory2 || null,
        itemCategory3: form.itemCategory3.trim() || null,
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
  const isCard = form.itemCategory1 === 'card'
  const isProduct = form.itemCategory1 === 'product'
  const subcategories = isCard ? CARD_SUBCATEGORIES : PRODUCT_SUBCATEGORIES

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
          <Field label="Tipo articolo" htmlFor="ep-item-category-1">
            <Select
              id="ep-item-category-1"
              value={form.itemCategory1}
              onChange={(e) => handleItemCategory1(e.target.value)}
            >
              <option value="product">Prodotto</option>
              <option value="card">Carta</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Sottocategoria" htmlFor="ep-item-category-2">
            <Select
              id="ep-item-category-2"
              value={form.itemCategory2}
              onChange={(e) => handleChange('itemCategory2', e.target.value)}
            >
              <option value="">—</option>
              {subcategories.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Livello 3 (opzionale)" htmlFor="ep-item-category-3">
            <Input
              id="ep-item-category-3"
              type="text"
              value={form.itemCategory3}
              onChange={(e) => handleChange('itemCategory3', e.target.value)}
              placeholder="dettaglio libero"
            />
          </Field>
          <Field label="Slug" htmlFor="ep-slug">
            <Input id="ep-slug" type="text" value={form.slug} disabled />
            <AutoHint text="generato dal titolo" />
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
            <Input id="ep-cogs" type="number" step="0.01" min="0" value={form.costOfGoodsSold} disabled />
            <AutoHint text="calcolato dai lotti (media ponderata)" />
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
              <Field label="Card Number" htmlFor="ep-card-number">
                <Input
                  id="ep-card-number"
                  type="text"
                  value={form.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        ) : null}

        {isProduct ? (
          <div className="space-y-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
              Dettagli prodotto
            </p>
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

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.showGoogle}
              onChange={(e) => handleChange('showGoogle', e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm font-medium text-[var(--ui-text-muted)]">
              Inserisci dati Google / Merchant Center
            </span>
          </label>
          {form.showGoogle ? (
            <div className="space-y-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
                Google / Merchant Center
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Item Group ID" htmlFor="ep-item-group">
                  <Input
                    id="ep-item-group"
                    type="text"
                    value={form.itemGroupId}
                    onChange={(e) => handleChange('itemGroupId', e.target.value)}
                  />
                </Field>
                <Field label="Product Type (Google)" htmlFor="ep-product-type">
                  <Input
                    id="ep-product-type"
                    type="text"
                    value={form.productType}
                    onChange={(e) => handleChange('productType', e.target.value)}
                    placeholder="es. Trading Card Game"
                  />
                </Field>
              </div>
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
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
