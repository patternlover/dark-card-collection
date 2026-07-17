'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface CartItem {
  id: number | string
  title: string
  slug: string
  price: number
  quantity: number
  image?: string | null
  maxQuantity?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: number | string) => void
  updateQuantity: (id: number | string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  shipping: number
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'dcc-cart'
const FREE_SHIPPING_THRESHOLD = 100

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      } catch {
        // ignore
      }
    }
  }, [items, loaded])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxQuantity || 99) }
            : i,
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }, [])

  const removeItem = useCallback((id: number | string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: number | string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(quantity, i.maxQuantity || 99) } : i,
      ),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99
  const total = subtotal + shipping
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
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
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
