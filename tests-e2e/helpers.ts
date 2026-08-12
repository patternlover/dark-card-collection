import crypto from 'node:crypto'
import type { Page } from '@playwright/test'

const SECRET = 'local-dash-session-secret-0001'
const COOKIE = 'dcc-dash'

export function dashToken(value: string): string {
  const data = `${value}.${Date.now()}`
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

export async function loginAs(page: Page, email = 'test@example.com'): Promise<void> {
  await page.context().addCookies([
    { name: COOKIE, value: dashToken(`google:${email}`), url: 'http://localhost:3000' },
  ])
}
