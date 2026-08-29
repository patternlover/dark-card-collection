/**
 * Medusa store API client (typed, dependency-free).
 * Usa la publishable key lato client/server per la store API.
 */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/+$/, "")
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export function isMedusaConfigured(): boolean {
  return Boolean(PUBLISHABLE_KEY && BACKEND_URL)
}

export function medusaBackendUrl(): string {
  return BACKEND_URL
}

interface FetchOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  /** Cache mode; default no-store (SSR). */
  cache?: RequestInit["cache"]
}

export async function medusaFetch<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  if (!isMedusaConfigured()) {
    throw new Error("Medusa non configurato (mancano NEXT_PUBLIC_MEDUSA_*)")
  }
  const res = await fetch(`${BACKEND_URL}/store${path}`, {
    method: opts.method || "GET",
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...opts.headers,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache ?? "no-store",
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message || `Medusa API ${res.status}`)
  }
  return res.json() as Promise<T>
}