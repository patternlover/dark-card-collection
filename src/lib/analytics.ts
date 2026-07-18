declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export interface EcommerceItem {
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

export function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

export function trackViewItemList(items: EcommerceItem[], listId: string, listName: string) {
  pushEvent('view_item_list', {
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items,
    },
  })
}

export function trackSelectItem(item: EcommerceItem, listId?: string, listName?: string) {
  pushEvent('select_item', {
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items: [item],
    },
  })
}

export function trackViewItem(item: EcommerceItem) {
  pushEvent('view_item', {
    ecommerce: { items: [item] },
  })
}

export function trackAddToCart(item: EcommerceItem) {
  pushEvent('add_to_cart', {
    ecommerce: { items: [item] },
  })
}

export function trackRemoveFromCart(item: EcommerceItem) {
  pushEvent('remove_from_cart', {
    ecommerce: { items: [item] },
  })
}

export function trackViewCart(items: EcommerceItem[], value: number) {
  pushEvent('view_cart', {
    ecommerce: {
      items,
      value,
      currency: 'EUR',
    },
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

export function trackSearch(term: string) {
  pushEvent('search', { search_term: term })
}

export function trackFilter(type: string, value: string) {
  pushEvent('filter', { filter_type: type, filter_value: value })
}

export function itemToEcommerce(
  product: Record<string, unknown>,
  listId?: string,
  listName?: string,
  position?: number,
): EcommerceItem {
  const cat = product.category as Record<string, unknown> | null | undefined
  const col = product.collection as Record<string, unknown> | null | undefined
  return {
    item_id: String(product.id),
    item_name: String(product.title || ''),
    item_category: (cat?.name as string) || '',
    item_category2: (col?.name as string) || '',
    item_variant: String(product.condition || ''),
    price: Number(product.storePrice || product.price || 0),
    currency: 'EUR',
    ...(listId && { item_list_id: listId }),
    ...(listName && { item_list_name: listName }),
    ...(position !== undefined && { item_list_position: position }),
  }
}
