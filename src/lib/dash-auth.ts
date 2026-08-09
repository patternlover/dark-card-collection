import crypto from 'crypto'
import { cookies } from 'next/headers'

export const COOKIE_NAME = 'dcc-dash'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
}

function getSecret(): string {
  return process.env.DASH_SESSION_SECRET || process.env.PAYLOAD_SECRET || 'dark-card-collection-dashboard'
}

export function signToken(value: string): string {
  const data = `${value}.${Date.now()}`
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  return `${data}.${sig}`
}

function verifyToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const secondLastDot = token.lastIndexOf('.', lastDot - 1)
  if (secondLastDot === -1) return false
  const sig = token.slice(lastDot + 1)
  const ts = token.slice(secondLastDot + 1, lastDot)
  const value = token.slice(0, secondLastDot)
  const expected = crypto.createHmac('sha256', getSecret()).update(`${value}.${ts}`).digest('hex')
  if (sig.length !== expected.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  if (Date.now() - Number(ts) > SESSION_TTL_MS) return false
  return true
}

export async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : false
}

export async function clearDashSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
