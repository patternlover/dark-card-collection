declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

interface EcommerceItem {
  item_id: string
  item_name: string
  item_category?: string
  item_category2?: string
  item_variant?: string
  item_brand?: string
  price: number
  currency: string
  quantity?: number
  item_list_id?: string
  item_list_name?: string
  item_list_position?: number
}

function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

export function trackAddToCart(item: EcommerceItem) {
  pushEvent('add_to_cart', {
    ecommerce: { items: [item] },
  })
}

export function trackBeginCheckout(items: EcommerceItem[], value: number) {
  pushEvent('begin_checkout', {
    ecommerce: {
      items,
      value,
      currency: 'EUR',
    },
  })
}

export function trackPurchase(transactionId: string, items: EcommerceItem[], value: number) {
  pushEvent('purchase', {
    ecommerce: {
      transaction_id: transactionId,
      items,
      value,
      currency: 'EUR',
    },
  })
}

export function trackFilter(type: string, value: string) {
  pushEvent('filter', { filter_type: type, filter_value: value })
}
