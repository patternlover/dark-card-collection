import crypto from 'crypto'
import { cookies } from 'next/headers'

export const COOKIE_NAME = 'dcc-dash'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getSecret(): string {
  return process.env.PAYLOAD_SECRET || 'dark-card-collection-dashboard'
}

export function signToken(value: string): string {
  const data = `${value}.${Date.now()}`
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  return `${data}.${sig}`
}

export function verifyToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [value, ts, sig] = parts
  const expected = crypto.createHmac('sha256', getSecret()).update(`${value}.${ts}`).digest('hex')
  if (sig !== expected) return false
  if (Date.now() - Number(ts) > SESSION_TTL_MS) return false
  return true
}

export async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : false
}

export async function setDashSession(value: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signToken(value), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function clearDashSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
