'use client'

import { useState } from 'react'
import type {
  CreateProductData,
  EspansioneOption,
  ProductDTO,
} from '@/app/dashboard/actions'
import { createProduct } from '@/app/dashboard/actions'
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
  { value: 'spc', label: 'Spc' },
  { value: 'box', label: 'Box' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'etb', label: 'Etb' },
  { value: 'tin', label: 'Tin' },
  { value: 'other', label: 'Altro' },
]

const CARD_SUBCATEGORIES = [
  { value: 'single', label: 'Singola' },
  { value: 'slab', label: 'Slab' },
  { value: 'other', label: 'Altro' },
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

interface CreateProductModalProps {
  espansioni: EspansioneOption[]
  initialProduct?: ProductDTO
  onClose: () => void
  onCreated: () => void
  onError: (msg: string) => void
}

export function CreateProductModal({
  espansioni,
  initialProduct,
  onClose,
  onCreated,
  onError,
}: CreateProductModalProps) {
  const [form, setForm] = useState({
    title: initialProduct?.title || '',
    slug: '',
    itemGroupId: initialProduct?.itemGroupId || '',
    description: initialProduct?.description || '',
    price: String(initialProduct?.price ?? ''),
    salePrice: String(initialProduct?.salePrice ?? ''),
    costOfGoodsSold: '',
    status: initialProduct?.status || 'listed',
    availability: initialProduct?.availability || 'in_stock',
    isPreorder: initialProduct?.isPreorder || false,
    grade: initialProduct?.grade || 'near-mint',
    condition: initialProduct?.condition || 'used',
    productType: initialProduct?.productType || '',
    googleProductCategory: initialProduct?.googleProductCategory || '',
    language: initialProduct?.language || 'italian',
    itemCategory2: String(initialProduct?.itemCategory2?.id || ''),
    cardNumber: initialProduct?.cardNumber || '',
    rarity: initialProduct?.rarity || '',
    quantity: '1',
    imageLink: initialProduct?.imageLink || '',
    itemCategory1: initialProduct?.itemCategory1 || 'product',
    itemCategory3: initialProduct?.itemCategory3 || '',
    showGoogle: Boolean(
      initialProduct?.itemGroupId ||
        initialProduct?.productType ||
        initialProduct?.googleProductCategory,
    ),
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemCategory1 = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, itemCategory1: value, itemCategory3: '' }
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

  const handleCreate = async () => {
    setSaving(true)
    try {
      const input: CreateProductData = {
        title: form.title.trim(),
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
        itemCategory2: form.itemCategory2 ? Number(form.itemCategory2) : null,
        cardNumber: form.itemCategory1 === 'card' ? (form.cardNumber.trim() || null) : null,
        rarity: form.itemCategory1 === 'card' ? (form.rarity || null) : null,
        quantity: Number(form.quantity) || 0,
        imageLink: form.imageLink.trim() || null,
        itemCategory1: form.itemCategory1,
        itemCategory3: form.itemCategory3 || null,
      }
      await createProduct(input)
      onCreated()
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
      title={initialProduct ? 'Duplica Prodotto' : 'Nuovo Prodotto'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleCreate} disabled={saving || !form.title.trim()}>
            {saving ? 'Creazione...' : initialProduct ? 'Duplica Prodotto' : 'Crea Prodotto'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Titolo *" htmlFor="cp-title">
            <Input
              id="cp-title"
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </Field>
          <Field label="Macro prodotto" htmlFor="cp-item-category-1">
            <Select
              id="cp-item-category-1"
              value={form.itemCategory1}
              onChange={(e) => handleItemCategory1(e.target.value)}
            >
              <option value="product">Prodotto</option>
              <option value="card">Carta</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Micro prodotto" htmlFor="cp-item-category-2">
            <Select
              id="cp-item-category-2"
              value={form.itemCategory3}
              onChange={(e) => handleChange('itemCategory3', e.target.value)}
            >
              <option value="">—</option>
              {subcategories.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Slug" htmlFor="cp-slug">
            <Input id="cp-slug" type="text" value={form.slug} disabled />
            <AutoHint text="generato dal titolo" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Disponibilità" htmlFor="cp-availability">
            <Select
              id="cp-availability"
              value={form.availability}
              onChange={(e) => handleChange('availability', e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Stato" htmlFor="cp-status">
            <Select
              id="cp-status"
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
          <Field label="Prezzo Vendita (€)" htmlFor="cp-price">
            <Input
              id="cp-price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
          </Field>
          <Field label="Costo Acquisto (€)" htmlFor="cp-cogs">
            <Input id="cp-cogs" type="number" step="0.01" min="0" value={form.costOfGoodsSold} disabled />
            <AutoHint text="calcolato dai lotti (media ponderata)" />
          </Field>
          <Field label="Prezzo Barrato (€)" htmlFor="cp-sale-price">
            <Input
              id="cp-sale-price"
              type="number"
              step="0.01"
              min="0"
              value={form.salePrice}
              onChange={(e) => handleChange('salePrice', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Quantità" htmlFor="cp-quantity">
            <Input
              id="cp-quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
          </Field>
          <Field label="Espansione" htmlFor="cp-expansion">
            <Select
              id="cp-expansion"
              value={form.itemCategory2}
              onChange={(e) => handleChange('itemCategory2', e.target.value)}
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
              <Field label="Condizione / Grado" htmlFor="cp-grade">
                <Select
                  id="cp-grade"
                  value={form.grade}
                  onChange={(e) => handleChange('grade', e.target.value)}
                >
                  {GRADE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Lingua" htmlFor="cp-language">
                <Select
                  id="cp-language"
                  value={form.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Card Number" htmlFor="cp-card-number">
                <Input
                  id="cp-card-number"
                  type="text"
                  value={form.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rarità" htmlFor="cp-rarity">
                <Select
                  id="cp-rarity"
                  value={form.rarity}
                  onChange={(e) => handleChange('rarity', e.target.value)}
                >
                  {RARITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Condizione (Google)" htmlFor="cp-condition">
                <Select
                  id="cp-condition"
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

        <Field label="Image Link" htmlFor="cp-image-link">
          <Input
            id="cp-image-link"
            type="url"
            value={form.imageLink}
            onChange={(e) => handleChange('imageLink', e.target.value)}
            placeholder="https://..."
          />
        </Field>

        <Field label="Descrizione" htmlFor="cp-description">
          <Textarea
            id="cp-description"
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
                <Field label="Item Group ID" htmlFor="cp-item-group">
                  <Input
                    id="cp-item-group"
                    type="text"
                    value={form.itemGroupId}
                    onChange={(e) => handleChange('itemGroupId', e.target.value)}
                  />
                </Field>
                <Field label="Product Type (Google)" htmlFor="cp-product-type">
                  <Input
                    id="cp-product-type"
                    type="text"
                    value={form.productType}
                    onChange={(e) => handleChange('productType', e.target.value)}
                    placeholder="es. Trading Card Game"
                  />
                </Field>
              </div>
              <Field label="Google Product Category" htmlFor="cp-gpc">
                <Input
                  id="cp-gpc"
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
