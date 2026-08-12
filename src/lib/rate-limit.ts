// Rate limiter in-memory per IP (per istanza serverless; sufficiente come primo
// livello su Vercel con cold-start). REQ-07.
const windows = new Map<string, number[]>()

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (windows.get(key) || []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    windows.set(key, recent)
    return true
  }
  recent.push(now)
  windows.set(key, recent)
  return false
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
