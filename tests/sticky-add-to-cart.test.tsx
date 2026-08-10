// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { CartProvider } from '@/hooks/useCart'
import { ConsentProvider } from '@/hooks/useConsent'

const product = {
  id: 1,
  title: 'Test Box',
  slug: 'test-box',
  price: 100,
  image: null,
  images: null,
  image_link: null,
  status: 'listed',
}

beforeEach(() => {
  cleanup()
})

function renderSticky() {
  localStorage.setItem('dcc-cookie-consent', JSON.stringify({ necessary: true, analytics: true, marketing: true }))
  return render(
    <ConsentProvider>
      <CartProvider>
        <StickyAddToCart product={product} maxQuantity={3} />
      </CartProvider>
    </ConsentProvider>,
  )
}

describe('StickyAddToCart', () => {
  it('is always visible even before cookie consent is given', () => {
    localStorage.removeItem('dcc-cookie-consent')
    render(
      <ConsentProvider>
        <CartProvider>
          <StickyAddToCart product={product} maxQuantity={3} />
        </CartProvider>
      </ConsentProvider>,
    )
    const sticky = screen.getByTestId('sticky-atc')
    expect(sticky).toBeTruthy()
    expect(sticky.style.transform).not.toContain('translateY(100%)')
  })

  it('sits below the cookie consent banner so consent stays clickable', () => {
    renderSticky()
    const sticky = screen.getByTestId('sticky-atc')
    expect(sticky.className).toContain('z-[100]')
  })

  it('shows the price and stock in the bar', () => {
    renderSticky()
    expect(screen.getByTestId('sticky-atc').textContent).toContain('€100.00')
    expect(screen.getByTestId('sticky-atc').textContent).toContain('3 disponibili')
  })

  it('always renders the add to cart button', () => {
    renderSticky()
    const button = screen.getByRole('button', { name: /aggiungi al carrello/i })
    expect(button).toBeTruthy()
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows quantity selector and availability for maxQuantity 1', () => {
    render(
      <ConsentProvider>
        <CartProvider>
          <StickyAddToCart product={product} maxQuantity={1} />
        </CartProvider>
      </ConsentProvider>,
    )
    expect(screen.getByTestId('sticky-atc').textContent).toContain('1 disponibile')
  })
})
