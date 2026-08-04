# GTM DataLayer — Guida Tracciamento

## 1. Setup Base

### Snippet iniziale (già in `layout.tsx`)

```tsx
// Prima di ogni push, inizializzare dataLayer
window.dataLayer = window.dataLayer || []
```

### Page View iniziale

Ogni cambio route (App Router) pusha automaticamente un evento `page_view`:

```tsx
// In un useEffect che ascolta il pathname
window.dataLayer.push({
  event: 'page_view',
  page_path: window.location.pathname + window.location.search,
  page_title: document.title,
})
```

---

## 2. Eventi E-commerce GA4 (Enhanced Ecommerce)

### 2.1 `view_item_list` — Lista prodotti visibile

**Trigger:** Shop page, bestsellers, new-arrivals, preorders, collections  
**Componente:** `ProductCard` (quando appare nella griglia)

```ts
window.dataLayer.push({
  event: 'view_item_list',
  ecommerce: {
    item_list_id: 'shop_main',       // o 'bestsellers', 'new_arrivals', etc.
    item_list_name: 'Shop',          // o 'Bestseller', 'Novità', etc.
    items: products.map((p, i) => ({
      item_id: String(p.id),
      item_name: p.title,
      affiliation: 'Dark Card Collection',
      item_category: p.category?.name || '',
      item_category2: p.collection?.name || '',
      item_variant: p.condition || '',
      item_list_position: i + 1,
      price: p.storePrice || p.price || 0,
      currency: 'EUR',
    })),
  },
})
```

---

### 2.2 `select_item` — Click su un prodotto

**Trigger:** Click su ProductCard o link al dettaglio  
**Componente:** `ProductCard`

```ts
window.dataLayer.push({
  event: 'select_item',
  ecommerce: {
    item_list_id: listId,
    item_list_name: listName,
    items: [{
      item_id: String(product.id),
      item_name: product.title,
      item_category: product.category?.name || '',
      item_category2: product.collection?.name || '',
      item_variant: product.condition || '',
      price: product.storePrice || product.price || 0,
      currency: 'EUR',
    }],
  },
})
```

---

### 2.3 `view_item` — Dettaglio prodotto

**Trigger:** Pagina `/products/[slug]`  
**Componente:** Product detail page

```ts
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    items: [{
      item_id: String(product.id),
      item_name: product.title,
      item_category: product.category?.name || '',
      item_category2: product.collection?.name || '',
      item_variant: product.condition || '',
      item_brand: product.language || '',
      price: product.storePrice || product.price || 0,
      currency: 'EUR',
      quantity: 1,
    }],
  },
})
```

---

### 2.4 `add_to_cart` — Aggiunto al carrello

**Trigger:** Click "Aggiungi al carrello"  
**Componente:** `AddToCartButton`

```ts
window.dataLayer.push({
  event: 'add_to_cart',
  ecommerce: {
    items: [{
      item_id: String(product.id),
      item_name: product.title,
      item_category: product.category?.name || '',
      item_category2: product.collection?.name || '',
      item_variant: product.condition || '',
      price: product.storePrice || product.price || 0,
      currency: 'EUR',
      quantity: quantity,
    }],
  },
})
```

---

### 2.5 `remove_from_cart` — Rimosso dal carrello

**Trigger:** Click "Rimuovi" nella pagina carrello  
**Componente:** Cart page

```ts
window.dataLayer.push({
  event: 'remove_from_cart',
  ecommerce: {
    items: [{
      item_id: String(item.id),
      item_name: item.title,
      price: item.price,
      currency: 'EUR',
      quantity: item.quantity,
    }],
  },
})
```

---

### 2.6 `view_cart` — Pagina carrello

**Trigger:** Accesso a `/cart`  
**Componente:** Cart page

```ts
window.dataLayer.push({
  event: 'view_cart',
  ecommerce: {
    items: cart.items.map((item) => ({
      item_id: String(item.id),
      item_name: item.title,
      price: item.price,
      currency: 'EUR',
      quantity: item.quantity,
    })),
    value: cart.subtotal,
    currency: 'EUR',
  },
})
```

---

### 2.7 `begin_checkout` — Inizio checkout

**Trigger:** Click "Paga con Stripe"  
**Componente:** Checkout page

```ts
window.dataLayer.push({
  event: 'begin_checkout',
  ecommerce: {
    items: cart.items.map((item) => ({
      item_id: String(item.id),
      item_name: item.title,
      price: item.price,
      currency: 'EUR',
      quantity: item.quantity,
    })),
    value: cart.total,
    currency: 'EUR',
    coupon: '',  // se applicabile in futuro
  },
})
```

---

### 2.8 `purchase` — Pagamento completato

**Trigger:** Webhook Stripe `checkout.session.completed`  
**Componente:** Server-side (webhook route)

```ts
// Nel webhook Stripe, dopo aver creato l'ordine
// Nota: questo push avviene server-side, serve inviare un evento
// a GTM via Measurement Protocol o server-side tag
// Alternativa: push client-side nella success page leggendo i params

// Client-side nella success page:
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: sessionId,
    value: sessionAmount / 100,
    tax: 0,         // da calcolare in futuro
    shipping: 0,    // da calcolare in futuro
    currency: 'EUR',
    items: orderItems.map((item) => ({
      item_id: String(item.productId),
      item_name: item.title,
      price: item.price,
      currency: 'EUR',
      quantity: item.quantity,
    })),
  },
})
```

---

## 3. Eventi Custom

### 3.1 `search` — Ricerca prodotti

**Trigger:** Submit della barra di ricerca nella shop page  
**Componente:** Search form in `shop/page.tsx`

```ts
window.dataLayer.push({
  event: 'search',
  search_term: query,
})
```

---

### 3.2 `filter` — Applicazione filtro

**Trigger:** Click su filtro (categoria, condizione, lingua, collezione)  
**Componente:** Filter links in `shop/page.tsx`

```ts
window.dataLayer.push({
  event: 'filter',
  filter_type: 'category',      // 'category' | 'condition' | 'language' | 'collection'
  filter_value: category.name,  // valore del filtro
})
```

---

### 3.3 `consent` — Consent Mode v2 (aggiornamento consenso cookie)

**Trigger:** Cambio preferenze cookie (banner)  
**Componente:** `useConsent` (`persistConsent`)

```ts
window.dataLayer.push({
  consent: 'update',
  ad_storage: 'granted' | 'denied',
  analytics_storage: 'granted' | 'denied',
  ad_user_data: 'granted' | 'denied',
  ad_personalization: 'granted' | 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'granted' | 'denied',
  security_storage: 'granted',
})
```

Prima di tutto (inline script `ConsentModeScript` nel `<body>` di `layout.tsx`) viene
pushato lo stato **`consent: 'default'`** con `ad_storage`, `analytics_storage`,
`ad_user_data`, `ad_personalization`, `personalization_storage = 'denied'` e
`functionality_storage`, `security_storage = 'granted'`. Se esiste già una scelta salvata
in `localStorage['dcc-cookie-consent']`, lo script applica subito un `consent: 'update'`
con i valori salvati.

Mappatura dei consensi del banner:
- `analytics_storage` e `personalization_storage` ← consenso **Analytics**
- `ad_storage`, `ad_user_data`, `ad_personalization` ← consenso **Marketing**

Nota: GTM viene caricato **solo dopo** interazione col banner e consenso analytics
(`AnalyticsProvider`): strategia "strict", niente cookie Google prima del consenso.

---

## 4. Utility Function

Creare `src/lib/analytics.ts`:

```ts
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function pushEvent(event: string, data?: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

export function trackViewItem(item: EcommerceItem, listId?: string, listName?: string) {
  pushEvent('view_item', {
    ecommerce: {
      items: [item],
      ...(listId && { item_list_id: listId }),
      ...(listName && { item_list_name: listName }),
    },
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

export function trackBeginCheckout(items: EcommerceItem[], value: number) {
  pushEvent('begin_checkout', {
    ecommerce: { items, value, currency: 'EUR' },
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

// --- Types ---
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
}
```

---

## 5. Integrazione GTM

### Caricamento condizionale GTM (solo dopo consenso analytics)

Lo stato di consenso viene impostato **prima di tutto** da `ConsentModeScript`
(script inline nel `<body>` di `layout.tsx`, push di `consent: 'default'` + eventuale
`consent: 'update'` da `localStorage`). `AnalyticsProvider` carica GTM solo quando
l'utente ha interagito col banner e ha consentito analytics:

```tsx
// src/components/layout/AnalyticsProvider.tsx
'use client'
import { useEffect } from 'react'
import { useConsent } from '@/hooks/useConsent'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { consent, hasInteracted } = useConsent()

  useEffect(() => {
    if (!hasInteracted || !consent.analytics || !GTM_ID) return
    // inject gtm.js (vedi componente)
  }, [consent.analytics, hasInteracted])

  return <>{children}</>
}
```

### Configurazione GTM Container

| Trigger | Tipo | Condizione |
|---------|------|------------|
| All Pages | Page View | Sempre |
| E-commerce Events | Custom Event | `event = view_item_list`, `add_to_cart`, etc. |
| Consent Granted | Consent Init / Consent Update | `consent` command in dataLayer con `analytics_storage = granted` |

### Variabili DataLayer GTM

| Variable Name | DataLayer Key | Tipo |
|---------------|---------------|------|
| DL - Event Name | `event` | String |
| DL - Item ID | `ecommerce.items[0].item_id` | String |
| DL - Item Name | `ecommerce.items[0].item_name` | String |
| DL - Value | `ecommerce.value` | Number |
| DL - Currency | `ecommerce.currency` | String |
| DL - Search Term | `search_term` | String |
| DL - Transaction ID | `ecommerce.transaction_id` | String |

---

## 6. Nota su GDPR / Privacy

**Regola fondamentale:** Nessun push a Google Analytics / GTM fino a che l'utente non acconsente ai cookie di analytics.

Il caricamento di GTM deve essere lazy — il tag GTM viene iniettato nel DOM **solo** dopo che l'utente accetta "Analytics" nel banner cookie.

Lo stato di consenso (default + update) segue il formato ufficiale **Consent Mode v2** (comando `consent` nel dataLayer, con `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`, `functionality_storage`, `personalization_storage`, `security_storage`).

---

## 7. Checklist Implementazione

- [ ] Creare `src/lib/analytics.ts` con utility functions
- [ ] Creare `src/hooks/useConsent.ts` per gestire stato consenso
- [ ] Creare componente `CookieConsent` banner
- [ ] Integrare GTM lazy-load in layout.tsx
- [ ] Push `view_item_list` nella shop page
- [ ] Push `select_item` nei ProductCard
- [ ] Push `view_item` nella product detail page
- [ ] Push `add_to_cart` in AddToCartButton
- [ ] Push `remove_from_cart` nel carrello
- [ ] Push `view_cart` nella cart page
- [ ] Push `begin_checkout` nel checkout
- [ ] Push `purchase` nella success page
- [ ] Push `search` nella search bar
- [ ] Push `filter` nei filtri shop
- [ ] Configurare trigger e variabili in GTM
- [ ] Testare con Google Tag Assistant
