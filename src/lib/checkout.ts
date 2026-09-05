/**
 * Helpers checkout condivisi tra pagina e API route.
 * - Indirizzo spedizione (Medusa richiede `shipping_address` per completare fisici).
 * - Snapshot ordine in sessionStorage (i guest non possono rileggere `/store/orders/:id`
 *   senza token: la success page usa prima lo snapshot).
 * - Appearance dark del Payment Element (solo stilizzazione, resta SAQ-A).
 */
import type { Appearance } from "@stripe/stripe-js"

export interface CheckoutAddress {
  first_name: string
  last_name: string
  address_1: string
  city: string
  postal_code: string
  country_code: string
}

export interface OrderSummaryItem {
  title: string
  quantity: number
  price: number
}

export interface OrderSummary {
  orderId: string
  transactionId: string
  value: number
  email: string
  items: OrderSummaryItem[]
}

export const EMPTY_ADDRESS: CheckoutAddress = {
  first_name: "",
  last_name: "",
  address_1: "",
  city: "",
  postal_code: "",
  country_code: "it",
}

/** Messaggi in italiano; array vuoto = form valido. */
export function validateCheckoutForm(email: string, address: CheckoutAddress): string[] {
  const errors: string[] = []
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Inserisci un indirizzo email valido.")
  }
  if (!address.first_name.trim()) errors.push("Inserisci il nome.")
  if (!address.last_name.trim()) errors.push("Inserisci il cognome.")
  if (!address.address_1.trim()) errors.push("Inserisci l'indirizzo di spedizione.")
  if (!address.city.trim()) errors.push("Inserisci la città.")
  if (address.country_code.toLowerCase() === "it" && !/^\d{5}$/.test(address.postal_code.trim())) {
    errors.push("Inserisci un CAP valido (5 cifre).")
  } else if (!address.postal_code.trim()) {
    errors.push("Inserisci il CAP.")
  }
  return errors
}

/**
 * Errori di `cart/complete` che vale la pena ritentare: la sessione Stripe viene
 * autorizzata dal webhook (`payment_intent.succeeded`) in modo asincrono, quindi il
 * primo tentativo può arrivare prima dell'autorizzazione.
 */
export function isRetryableCompleteError(message: string): boolean {
  return /not.?authorized|authoriz|payment.?session|pending|webhook|capture/i.test(message)
}

const SNAPSHOT_KEY = "dcc-last-order"

function storage(): Storage | null {
  try {
    // globalThis (non window): funziona anche in SSR e nei test node + polyfill.
    const s = (globalThis as Record<string, unknown>).sessionStorage
    return s ? (s as Storage) : null
  } catch {
    return null
  }
}

export function saveOrderSnapshot(order: OrderSummary): void {
  try {
    storage()?.setItem(SNAPSHOT_KEY, JSON.stringify(order))
  } catch {
    // snapshot best-effort: la success page ha comunque la fetch API
  }
}

export function loadOrderSnapshot(orderId: string | null): OrderSummary | null {
  try {
    const raw = storage()?.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OrderSummary
    if (!parsed || typeof parsed !== "object") return null
    if (orderId && parsed.orderId !== orderId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearOrderSnapshot(): void {
  try {
    storage()?.removeItem(SNAPSHOT_KEY)
  } catch {
    // ignora
  }
}

interface MedusaOrderLike {
  id?: string
  display_id?: number
  email?: string
  total?: number
  items?: Array<{ title?: string; quantity?: number; unit_price?: number }>
}

/** Mappa un ordine Medusa (importi in centesimi) allo shape della success page. */
export function toOrderSummary(order: MedusaOrderLike, fallbackId: string): OrderSummary | null {
  const orderId = order.id ?? fallbackId
  if (!orderId) return null
  return {
    orderId,
    transactionId: String(order.display_id ?? order.id ?? fallbackId),
    value: Number(order.total ?? 0) / 100,
    email: order.email ?? "",
    items: (order.items ?? []).map((item) => ({
      title: item.title ?? "Prodotto",
      quantity: item.quantity ?? 0,
      price: Number(item.unit_price ?? 0) / 100,
    })),
  }
}

/** Tema dark del Payment Element (accent giallo del sito, resta hosted da Stripe). */
export const STRIPE_APPEARANCE: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#FACC15",
    colorBackground: "#09090b",
    colorText: "#fafafa",
    colorTextSecondary: "#a1a1aa",
    colorDanger: "#f87171",
    colorTextPlaceholder: "#71717a",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "2px solid #3f3f46",
      backgroundColor: "#000000",
    },
    ".Input:focus": {
      border: "2px solid #FACC15",
    },
    ".Label": {
      color: "#a1a1aa",
      fontSize: "14px",
    },
  },
}
