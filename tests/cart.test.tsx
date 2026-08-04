// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '@/hooks/useCart'
import { QuickAddButton } from '@/components/product/QuickAddButton'
import CartPage from '@/app/cart/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

beforeEach(() => {
  cleanup()
  localStorage.clear()
})

function AddHarness() {
  const { addItem, items } = useCart()
  return (
    <div>
      <button type="button" onClick={() => addItem({ id: 1, title: 'Test', slug: 'test', price: 10, maxQuantity: 3 }, 5)}>
        add
      </button>
      <span data-testid="qty">{items[0]?.quantity ?? 0}</span>
      <span data-testid="max">{items[0]?.maxQuantity ?? 0}</span>
    </div>
  )
}

function QuickHarness() {
  const { items } = useCart()
  return (
    <div>
      <QuickAddButton
        product={{ id: 2, title: 'Box', slug: 'box', storePrice: 20, status: 'listed', quantity: 1 }}
        maxQuantity={7}
      />
      <span data-testid="qty">{items[0]?.quantity ?? 0}</span>
      <span data-testid="max">{items[0]?.maxQuantity ?? 0}</span>
    </div>
  )
}

describe('useCart clamp', () => {
  it('clamps quantity to maxQuantity for new items', () => {
    render(
      <CartProvider>
        <AddHarness />
      </CartProvider>,
    )
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('qty').textContent).toBe('3')
    expect(screen.getByTestId('max').textContent).toBe('3')
  })

  it('merges quantities for the same product id', () => {
    function MergeHarness() {
      const { addItem, items } = useCart()
      return (
        <div>
          <button type="button" onClick={() => addItem({ id: 1, title: 'Test', slug: 'test', price: 10, maxQuantity: 5 }, 2)}>
            add2
          </button>
          <span data-testid="rows">{items.length}</span>
          <span data-testid="qty">{items[0]?.quantity ?? 0}</span>
        </div>
      )
    }
    render(
      <CartProvider>
        <MergeHarness />
      </CartProvider>,
    )
    fireEvent.click(screen.getByText('add2'))
    fireEvent.click(screen.getByText('add2'))
    expect(screen.getByTestId('rows').textContent).toBe('1')
    expect(screen.getByTestId('qty').textContent).toBe('4')
  })

  it('QuickAddButton uses the group totalQuantity as maxQuantity', () => {
    render(
      <CartProvider>
        <QuickHarness />
      </CartProvider>,
    )
    fireEvent.click(screen.getByTitle('Aggiungi al carrello'))
    expect(screen.getByTestId('qty').textContent).toBe('1')
    expect(screen.getByTestId('max').textContent).toBe('7')
  })
})

describe('CartPage', () => {
  it('disables the plus button when quantity reaches maxQuantity', () => {
    localStorage.setItem(
      'dcc-cart',
      JSON.stringify([
        { id: 1, title: 'Test', slug: 'test', price: 10, quantity: 3, maxQuantity: 3 },
      ]),
    )
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )
    const plus = screen.getByRole('button', { name: 'Aumenta quantità' })
    expect((plus as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables the plus button below maxQuantity', () => {
    localStorage.setItem(
      'dcc-cart',
      JSON.stringify([
        { id: 1, title: 'Test', slug: 'test', price: 10, quantity: 2, maxQuantity: 3 },
      ]),
    )
    render(
      <CartProvider>
        <CartPage />
      </CartProvider>,
    )
    const plus = screen.getByRole('button', { name: 'Aumenta quantità' })
    expect((plus as HTMLButtonElement).disabled).toBe(false)
  })
})
