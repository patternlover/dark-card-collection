'use client'

import { useState } from 'react'
import type {
  CategoryOption,
  CollectionOption,
  ProductDTO,
  UpdateProductPatch,
} from '@/app/dashboard/actions'
import { updateProduct } from '@/app/dashboard/actions'
import { Alert, Button, Field, Input, Modal, ModalSection, Select, Textarea } from './ui'

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

interface EditProductModalProps {
  product: ProductDTO
  categories: CategoryOption[]
  collections: CollectionOption[]
  onClose: () => void
  onSaved: (saved: ProductDTO) => void
}

export function EditProductModal({
  product,
  categories,
  collections,
  onClose,
  onSaved,
}: EditProductModalProps) {
  const [form, setForm] = useState({
    title: product.title || '',
    slug: product.slug || '',
    itemGroupId: product.itemGroupId || '',
    description: product.description || '',
    price: product.price != null ? String(product.price) : '',
    salePrice: product.salePrice != null ? String(product.salePrice) : '',
    status: product.status || 'listed',
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
  const [modalError, setModalError] = useState<string | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setModalError(null)
    try {
      const patch: UpdateProductPatch = {
        title: form.title.trim() || product.title,
        slug: form.slug.trim(),
        itemGroupId: form.itemGroupId.trim() || null,
        description: form.description.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        salePrice: form.salePrice === '' ? null : Number(form.salePrice),
        status: form.status,
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
      setModalError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const checkboxClass = 'h-4 w-4 accent-[var(--ui-accent)]'

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
        {modalError ? <Alert tone="danger">{modalError}</Alert> : null}

        <ModalSection title="Informazioni">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Titolo *" htmlFor="ep-title">
              <Input
                id="ep-title"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </Field>
            <Field label="Item Group ID" htmlFor="ep-item-group">
              <Input
                id="ep-item-group"
                type="text"
                value={form.itemGroupId}
                onChange={(e) => handleChange('itemGroupId', e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Slug" htmlFor="ep-slug">
              <Input
                id="ep-slug"
                type="text"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Descrizione" htmlFor="ep-description">
              <Textarea
                id="ep-description"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Field>
          </div>
        </ModalSection>

        <ModalSection title="Prezzo e inventario">
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
            <Field label="Quantità" htmlFor="ep-quantity">
              <Input
                id="ep-quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
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
            <Field label="Pre-Ordine" htmlFor="ep-preorder">
              <label className="flex h-[38px] cursor-pointer items-center gap-2">
                <input
                  id="ep-preorder"
                  type="checkbox"
                  checked={form.isPreorder}
                  onChange={(e) => handleChange('isPreorder', e.target.checked)}
                  className={checkboxClass}
                />
                <span className="text-sm font-medium text-[var(--ui-text-muted)]">
                  Prodotto in pre-ordine
                </span>
              </label>
            </Field>
          </div>
        </ModalSection>

        <ModalSection title="Dettagli carta">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Grado" htmlFor="ep-grade">
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
            <Field label="Condizione" htmlFor="ep-condition">
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
          <div className="mt-4 grid grid-cols-2 gap-4">
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
        </ModalSection>

        <ModalSection title="Catalogo">
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Collezione" htmlFor="ep-collection">
              <Select
                id="ep-collection"
                value={form.collection}
                onChange={(e) => handleChange('collection', e.target.value)}
              >
                <option value="">—</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
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
        </ModalSection>

        <ModalSection title="Immagine">
          <Field label="Image Link" htmlFor="ep-image-link">
            <Input
              id="ep-image-link"
              type="url"
              value={form.imageLink}
              onChange={(e) => handleChange('imageLink', e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </ModalSection>

        <ModalSection title="Opzioni">
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
        </ModalSection>
      </div>
    </Modal>
  )
}
