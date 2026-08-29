"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  addMedusaLineItem,
  createMedusaCart,
  getMedusaCart,
  getMedusaRegionId,
  MedusaLineItem,
  removeMedusaLineItem,
  updateMedusaLineItem,
} from "@/lib/medusa/cart"

export interface CartItem {
  /** Per i line item Medusa: è l'id del line item (per update/remove). */
  id: number | string
  title: string
  slug: string
  price: number
  quantity: number
  image?: string | null
  maxQuantity?: number
  /** Variant id Medusa (usato da ATC per l'aggiunta). */
  variantId?: string
}

interface CartContextType {
  items: CartItem[]
  cartId: string | null
  loading: boolean
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (id: number | string) => void
  updateQuantity: (id: number | string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  shipping: number
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

const CART_KEY = "dcc-medusa-cart"
const FREE_SHIPPING_THRESHOLD = 80

export function toCartItem(line: MedusaLineItem): CartItem {
  return {
    id: line.id,
    variantId: line.variant_id,
    title: line.title,
    slug: "",
    price: Number(line.unit_price ?? 0) / 100,
    quantity: Number(line.quantity ?? 0),
    image: line.thumbnail ?? null,
  }
}

export function computeTotals(items: CartItem[]) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(CART_KEY) : null
    if (stored) {
      setCartId(stored)
      getMedusaCart(stored)
        .then((cart) => setItems((cart.items ?? []).map(toCartItem)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const persistCartId = useCallback((id: string) => {
    setCartId(id)
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_KEY, id)
    }
  }, [])

  const refreshFromCart = useCallback((cartId: string) => {
    return getMedusaCart(cartId)
      .then((cart) => setItems((cart.items ?? []).map(toCartItem)))
      .catch(() => setItems([]))
  }, [])

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cartId) return cartId
    const regionId = await getMedusaRegionId()
    const cart = await createMedusaCart(regionId)
    persistCartId(cart.id)
    return cart.id
  }, [cartId, persistCartId])

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const variantId = String(item.variantId ?? item.id)
      try {
        const id = await ensureCart()
        await addMedusaLineItem(id, variantId, quantity)
        await refreshFromCart(id)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dcc:cart-add", { detail: 1 }))
        }
      } catch {
        // cart Medusa non raggiungibile: ignora
      }
    },
    [ensureCart, refreshFromCart],
  )

  const removeItem = useCallback(
    async (id: number | string) => {
      if (!cartId) return
      try {
        await removeMedusaLineItem(cartId, String(id))
        await refreshFromCart(cartId)
      } catch {
        // ignora
      }
    },
    [cartId, refreshFromCart],
  )

  const updateQuantity = useCallback(
    async (id: number | string, quantity: number) => {
      if (!cartId) return
      try {
        if (quantity <= 0) {
          await removeMedusaLineItem(cartId, String(id))
        } else {
          await updateMedusaLineItem(cartId, String(id), quantity)
        }
        await refreshFromCart(cartId)
      } catch {
        // ignora
      }
    },
    [cartId, refreshFromCart],
  )

  const clearCart = useCallback(() => {
    setItems([])
    setCartId(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_KEY)
    }
  }, [])

  const { subtotal, shipping, total, itemCount } = computeTotals(items)

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        shipping,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}