// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { act } from 'react'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { CartProvider } from '@/hooks/useCart'
import { ConsentProvider } from '@/hooks/useConsent'

const product = {
  id: 1,
  title: 'Test Box',
  slug: 'test-box',
  price: 100,
  storePrice: 100,
  image: null,
  images: null,
  imageUrl: null,
  status: 'listed',
}

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect

let sentinelTop = 200
let footerTop = 9999

beforeEach(() => {
  cleanup()
  window.innerHeight = 800
  sentinelTop = 200
  footerTop = 9999
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const el = this as HTMLElement
    if (el.dataset?.testid === 'atc-sentinel') {
      return {
        x: 0,
        y: sentinelTop,
        top: sentinelTop,
        bottom: sentinelTop,
        left: 0,
        right: 800,
        width: 800,
        height: 0,
        toJSON: () => ({}),
      } as DOMRect
    }
    if (el.tagName === 'FOOTER') {
      return {
        x: 0,
        y: footerTop,
        top: footerTop,
        bottom: footerTop + 200,
        left: 0,
        right: 800,
        width: 800,
        height: 200,
        toJSON: () => ({}),
      } as DOMRect
    }
    return originalGetBoundingClientRect.call(this)
  }
})

function renderSticky() {
  localStorage.setItem('dcc-cookie-consent', JSON.stringify({ necessary: true, analytics: true, marketing: true }))
  return render(
    <ConsentProvider>
      <CartProvider>
        <footer />
        <StickyAddToCart product={product} maxQuantity={3} />
      </CartProvider>
    </ConsentProvider>,
  )
}

function renderStickyWithoutConsent() {
  localStorage.removeItem('dcc-cookie-consent')
  return render(
    <ConsentProvider>
      <CartProvider>
        <footer />
        <StickyAddToCart product={product} maxQuantity={3} />
      </CartProvider>
    </ConsentProvider>,
  )
}

describe('StickyAddToCart', () => {
  it('stays hidden until cookie consent is given', () => {
    renderStickyWithoutConsent()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(100%)')
  })

  it('is hidden while the buy box is in view', () => {
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(100%)')
  })

  it('appears when the buy box is below the desktop viewport', () => {
    sentinelTop = 900
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(0)')
  })

  it('appears on a mobile viewport when the buy box is below the fold', () => {
    window.innerHeight = 667
    sentinelTop = 700
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(0)')
  })

  it('appears when scrolled past the buy box and hides again on scroll back up', () => {
    sentinelTop = -100
    renderSticky()
    const sticky = screen.getByTestId('sticky-atc')
    expect(sticky.style.transform).toContain('translateY(0)')

    sentinelTop = 200
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(sticky.style.transform).toContain('translateY(100%)')
  })

  it('hides when the footer enters the viewport even if the buy box is out', () => {
    sentinelTop = -100
    footerTop = 500
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(100%)')
  })

  it('shows the price and stock in the bar', () => {
    sentinelTop = 900
    renderSticky()
    expect(screen.getByTestId('sticky-atc').textContent).toContain('€100.00')
    expect(screen.getByTestId('sticky-atc').textContent).toContain('3 disponibili')
  })
})
