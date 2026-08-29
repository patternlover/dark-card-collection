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
  clearCustomerToken,
  getCustomer,
  getCustomerOrders,
  getCustomerToken,
  loginCustomer,
  MedusaCustomer,
  MedusaOrder,
  registerCustomer,
} from "@/lib/medusa/customer"

interface AuthContextType {
  customer: MedusaCustomer | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>
  logout: () => void
  orders: MedusaOrder[]
  refreshOrders: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<MedusaCustomer | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<MedusaOrder[]>([])

  useEffect(() => {
    const stored = getCustomerToken()
    if (stored) {
      setToken(stored)
      getCustomer(stored)
        .then((c) => setCustomer(c))
        .catch(() => clearCustomerToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token: t, customer: c } = await loginCustomer(email, password)
    setToken(t)
    setCustomer(c)
  }, [])

  const register = useCallback(
    async (email: string, password: string, firstName?: string, lastName?: string) => {
      const { token: t, customer: c } = await registerCustomer(
        email,
        password,
        firstName,
        lastName,
      )
      setToken(t)
      setCustomer(c)
    },
    [],
  )

  const logout = useCallback(() => {
    clearCustomerToken()
    setToken(null)
    setCustomer(null)
    setOrders([])
  }, [])

  const refreshOrders = useCallback(async () => {
    if (!token) return
    const list = await getCustomerOrders(token)
    setOrders(list)
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        loading,
        login,
        register,
        logout,
        orders,
        refreshOrders,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}