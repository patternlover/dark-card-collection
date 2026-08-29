/**
 * Auth + dati account cliente via store API Medusa.
 * Il token JWT del customer vive in localStorage (`dcc-medusa-token`) e viene
 * passato come Bearer alle rotte /store che lo richiedono.
 */
import { medusaFetch } from "./client"

export interface MedusaCustomer {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}

export interface MedusaOrder {
  id: string
  display_id?: number
  status?: string
  total?: number
  created_at?: string
  items?: Array<{ title?: string; quantity?: number; unit_price?: number }>
}

export interface AuthResponse {
  token: string
}

export const CUSTOMER_TOKEN_KEY = "dcc-medusa-token"

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CUSTOMER_TOKEN_KEY)
}

export function setCustomerToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
  }
}

export function clearCustomerToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  }
}

/** Login: POST /auth/customer/emailpass. */
export async function loginCustomer(
  email: string,
  password: string,
): Promise<{ token: string; customer: MedusaCustomer | null }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/auth/customer/emailpass`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  )
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message || "Credenziali non valide")
  }
  const data = (await res.json()) as AuthResponse
  setCustomerToken(data.token)
  let customer: MedusaCustomer | null = null
  try {
    customer = await getCustomer(data.token)
  } catch {
    customer = null
  }
  return { token: data.token, customer }
}

/**
 * Register: crea l'auth identity (token) e poi il customer via /store/customers.
 */
export async function registerCustomer(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<{ token: string; customer: MedusaCustomer }> {
  const base =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  const res = await fetch(`${base}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message || "Registrazione non riuscita")
  }
  const data = (await res.json()) as AuthResponse

  const customer = await medusaFetch<{ customer: MedusaCustomer }>(
    `/customers`,
    {
      method: "POST",
      token: data.token,
      body: {
        email,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
      },
    },
  )

  // Il token di register è "actorless": serve un login per ottenere il token
  // con l'actor (customer) associato (richiesto dalle rotte /store/customers/me).
  const { token: finalToken } = await loginCustomer(email, password)
  return { token: finalToken, customer: customer.customer }
}

/** Dati del customer autenticato. */
export async function getCustomer(token: string): Promise<MedusaCustomer> {
  const data = await medusaFetch<{ customer: MedusaCustomer }>(`/customers/me`, {
    token,
  })
  return data.customer
}

/** Storico ordini del customer autenticato. */
export async function getCustomerOrders(
  token: string,
): Promise<MedusaOrder[]> {
  const data = await medusaFetch<{ orders: MedusaOrder[] }>(`/orders`, {
    token,
  })
  return data.orders ?? []
}