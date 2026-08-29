// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { computeTotals, toCartItem } from '@/hooks/useCart'
import { render, screen } from '@testing-library/react'
import { CartProvider } from '@/hooks/useCart'
import { QuickAddButton } from '@/components/product/QuickAddButton'

describe('computeTotals', () => {
  it('charges 9.99 shipping under the free threshold', () => {
    const t = computeTotals([
      { id: 'l1', title: 'A', slug: 'a', price: 30, quantity: 2 },
    ])
    expect(t.subtotal).toBe(60)
    expect(t.shipping).toBe(9.99)
    expect(t.total).toBe(69.99)
    expect(t.itemCount).toBe(2)
  })

  it('applies free shipping from 80€', () => {
    const t = computeTotals([
      { id: 'l1', title: 'A', slug: 'a', price: 90, quantity: 1 },
    ])
    expect(t.subtotal).toBe(90)
    expect(t.shipping).toBe(0)
    expect(t.total).toBe(90)
  })

  it('returns zero totals for an empty cart', () => {
    const t = computeTotals([])
    expect(t.subtotal).toBe(0)
    expect(t.shipping).toBe(9.99)
    expect(t.total).toBe(9.99)
    expect(t.itemCount).toBe(0)
  })
})

describe('toCartItem', () => {
  it('converts a Medusa line item (cents → euros)', () => {
    const item = toCartItem({
      id: 'line_1',
      title: 'Bundle Paldea Evolved',
      thumbnail: 'https://img/x.jpg',
      unit_price: 12000,
      quantity: 2,
      variant_id: 'variant_1',
    })
    expect(item).toMatchObject({
      id: 'line_1',
      variantId: 'variant_1',
      title: 'Bundle Paldea Evolved',
      price: 120,
      quantity: 2,
      image: 'https://img/x.jpg',
    })
  })
})

describe('QuickAddButton', () => {
  it('is hidden when the product is sold out (stock 0)', () => {
    render(
      <CartProvider>
        <QuickAddButton
          product={{ id: 3, title: 'Sold', slug: 'sold', price: 10, status: 'listed', quantity: 0 }}
          maxQuantity={0}
        />
      </CartProvider>,
    )
    expect(screen.queryByTitle('Aggiungi al carrello')).toBeNull()
  })
})