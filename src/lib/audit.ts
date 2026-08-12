// Audit logging strutturato (REQ-12): log JSON su console (catturati dai log
// Vercel), senza MAI includere segreti/token/session id/carte.
export function logAudit(event: string, data: Record<string, unknown>): void {
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (/secret|token|session|cookie|password|hash|salt|card|stripe_key/i.test(k)) continue
    safe[k] = v
  }
  console.log(JSON.stringify({ ts: new Date().toISOString(), audit: event, ...safe }))
}
