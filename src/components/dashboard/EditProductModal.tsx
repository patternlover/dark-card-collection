'use client'

import { useState } from 'react'
import type { ProductDTO, UpdateProductPatch } from '@/app/dashboard/actions'
import { updateProduct } from '@/app/dashboard/actions'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'

const GRADE_OPTIONS = [
  { value: 'mint', label: 'Mint' },
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

interface EditProductModalProps {
  product: ProductDTO
  onClose: () => void
  onSaved: (saved: ProductDTO) => void
  onError: (msg: string) => void
}

export function EditProductModal({ product, onClose, onSaved, onError }: EditProductModalProps) {
  const isCard = product.itemCategory1 === 'card'

  const [form, setForm] = useState({
    title: product.title || '',
    description: product.description || '',
    price: product.price != null ? String(product.price) : '',
    salePrice: product.salePrice != null ? String(product.salePrice) : '',
    grade: product.grade || 'near-mint',
    condition: product.condition || 'used',
    productType: product.productType || '',
    googleProductCategory: product.googleProductCategory || '',
    cardNumber: product.cardNumber || '',
    itemGroupId: product.itemGroupId || '',
    showGoogle: Boolean(
      product.itemGroupId || product.productType || product.googleProductCategory,
    ),
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
        itemGroupId: form.showGoogle ? (form.itemGroupId.trim() || null) : null,
        description: form.description.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        salePrice: form.salePrice === '' ? null : Number(form.salePrice),
        grade: isCard ? form.grade : 'near-mint',
        condition: isCard ? form.condition : 'new',
        productType: form.showGoogle ? (form.productType.trim() || null) : null,
        googleProductCategory: form.showGoogle
          ? (form.googleProductCategory.trim() || null)
          : null,
        cardNumber: isCard ? (form.cardNumber.trim() || null) : null,
      }
      const res = await updateProduct(product.id, patch)
      if (!res.ok) {
        onError(res.message)
        return
      }
      onSaved(res.data)
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }


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
        <Field label="Titolo *" htmlFor="ep-title">
          <Input
            id="ep-title"
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </Field>

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

        {isCard ? (
          <div className="space-y-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-text-faint)]">
              Dettagli carta
            </p>
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
            <Field label="Card Number" htmlFor="ep-card-number">
              <Input
                id="ep-card-number"
                type="text"
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
              />
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
        ) : null}

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
              className="h-4 w-4 accent-[var(--ui-accent)]"
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
