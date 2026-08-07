import crypto from 'crypto'

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function bearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const token = bearerToken(request)
  return token !== null && safeEqual(token, cronSecret)
}

export function verifySyncPassword(request: Request): boolean {
  const syncPassword = process.env.SYNC_PASSWORD
  if (!syncPassword) return false
  const password = request.headers.get('x-sync-password')
  return password !== null && safeEqual(password, syncPassword)
}
