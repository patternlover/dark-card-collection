'use client'

import { useState } from 'react'
import type { ProductDTO } from '@/app/dashboard/actions'
import { recordExternalSale } from '@/app/dashboard/actions'
import { Button, Field, Input, Modal, Select } from './ui'

const PLATFORM_OPTIONS = [
  { value: 'vinted', label: 'Vinted' },
  { value: 'wallapop', label: 'Wallapop' },
  { value: 'ebay', label: 'eBay' },
  { value: 'subito', label: 'Subito.it' },
  { value: 'altro', label: 'Altro' },
]

interface ExternalSaleModalProps {
  product: ProductDTO
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}

export function ExternalSaleModal({
  product,
  onClose,
  onSuccess,
  onError,
}: ExternalSaleModalProps) {
  const [quantity, setQuantity] = useState('1')
  const [platform, setPlatform] = useState('vinted')
  const [salePrice, setSalePrice] = useState(product.price ? String(product.price) : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const qty = Number(quantity) || 1
      const price = Number(salePrice)
      if (isNaN(price) || price < 0) {
        throw new Error('Inserisci un prezzo di vendita valido')
      }
      if (qty <= 0) {
        throw new Error('La quantità deve essere maggiore di 0')
      }

      await recordExternalSale({
        productId: product.id,
        quantity: qty,
        platform,
        salePrice: price,
      })
      onSuccess()
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Registra Vendita Esterna — ${product.title}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Registrazione...' : 'Registra Vendita'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-[var(--ui-text-muted)]">
          Disponibilità attuale in inventario: <span className="font-semibold text-[var(--ui-text)]">{product.quantity ?? 1}</span>
        </p>

        <Field label="Piattaforma di vendita *" htmlFor="es-platform">
          <Select
            id="es-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantità venduta *" htmlFor="es-qty">
            <Input
              id="es-qty"
              type="number"
              min="1"
              max={product.quantity ?? 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Prezzo effettivo incassato (€) *" htmlFor="es-price">
            <Input
              id="es-price"
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
