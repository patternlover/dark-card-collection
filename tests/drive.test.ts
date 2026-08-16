import { describe, it, expect } from 'vitest'
import { normalizePrivateKey } from '@/lib/drive'

describe('normalizePrivateKey', () => {
  it('parses a full service-account JSON and extracts private_key + client_email', () => {
    const json = JSON.stringify({
      type: 'service_account',
      private_key: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
      client_email: 'sa@project.iam.gserviceaccount.com',
    })
    const res = normalizePrivateKey(json)
    expect(res.key).toContain('-----BEGIN PRIVATE KEY-----')
    expect(res.key).toContain('\nABC\n')
    expect(res.clientEmail).toBe('sa@project.iam.gserviceaccount.com')
  })

  it('normalizes escaped \\n in a plain PEM string', () => {
    const res = normalizePrivateKey('-----BEGIN PRIVATE KEY-----\\nAAA\\n-----END PRIVATE KEY-----\\n')
    expect(res.key).toBe('-----BEGIN PRIVATE KEY-----\nAAA\n-----END PRIVATE KEY-----')
    expect(res.clientEmail).toBeUndefined()
  })

  it('strips surrounding quotes', () => {
    const res = normalizePrivateKey('"-----BEGIN PRIVATE KEY-----\\nKEY\\n-----END PRIVATE KEY-----\\n"')
    expect(res.key.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true)
    expect(res.key.endsWith('-----END PRIVATE KEY-----')).toBe(true)
  })

  it('keeps raw multiline PEM as-is (no \\n to replace)', () => {
    const pem = '-----BEGIN PRIVATE KEY-----\nXYZ\n-----END PRIVATE KEY-----\n'
    const res = normalizePrivateKey(pem)
    expect(res.key).toBe(pem.trim())
  })

  it('falls back to raw input when JSON is malformed', () => {
    const res = normalizePrivateKey('{broken json')
    expect(res.key).toBe('{broken json')
  })
})
