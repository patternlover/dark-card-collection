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

/**
 * Push ecommerce conforme a GA4: PRIMA ripulisce l'evento precedente con
 * `{ ecommerce: null }` (pattern Google), altrimenti i begin_checkout/purchase
 * si accumulano nel dataLayer e GA4 riceve eventi duplicati.
 */
function pushEcommerce(event: string, ecommerce: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce })
}

export function trackAddToCart(item: EcommerceItem) {
  pushEcommerce('add_to_cart', { items: [item] })
}

export function trackBeginCheckout(items: EcommerceItem[], value: number) {
  pushEcommerce('begin_checkout', {
    items,
    value,
    currency: 'EUR',
  })
}

export function trackPurchase(transactionId: string, items: EcommerceItem[], value: number) {
  pushEcommerce('purchase', {
    transaction_id: transactionId,
    items,
    value,
    currency: 'EUR',
  })
}

export function trackFilter(type: string, value: string) {
  pushEvent('filter', { filter_type: type, filter_value: value })
}
