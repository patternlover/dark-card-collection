// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { act } from 'react'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { CartProvider } from '@/hooks/useCart'

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

let mainRect = { top: 0, bottom: 0 }

beforeEach(() => {
  cleanup()
  window.innerHeight = 800
  mainRect = { top: 200, bottom: 300 }
  Element.prototype.getBoundingClientRect = function (this: Element) {
    if ((this as HTMLElement).dataset?.testid === 'main-atc') {
      return {
        x: 0,
        y: mainRect.top,
        top: mainRect.top,
        bottom: mainRect.bottom,
        left: 0,
        right: 800,
        width: 800,
        height: mainRect.bottom - mainRect.top,
        toJSON: () => ({}),
      } as DOMRect
    }
    return originalGetBoundingClientRect.call(this)
  }
})

function renderSticky() {
  return render(
    <CartProvider>
      <StickyAddToCart product={product} maxQuantity={3} />
    </CartProvider>,
  )
}

describe('StickyAddToCart', () => {
  it('is hidden while the main button is visible', () => {
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(100%)')
  })

  it('appears when the main button scrolls fully below the desktop viewport', () => {
    mainRect = { top: 900, bottom: 1000 }
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(0)')
  })

  it('appears on a mobile viewport when the main button is below the fold', () => {
    window.innerHeight = 667
    mainRect = { top: 700, bottom: 800 }
    renderSticky()
    expect(screen.getByTestId('sticky-atc').style.transform).toContain('translateY(0)')
  })

  it('appears when scrolled past the main button and hides again on scroll back up', () => {
    mainRect = { top: 900, bottom: 1000 }
    renderSticky()
    const sticky = screen.getByTestId('sticky-atc')
    expect(sticky.style.transform).toContain('translateY(0)')

    mainRect = { top: 150, bottom: 250 }
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(sticky.style.transform).toContain('translateY(100%)')
  })
})
