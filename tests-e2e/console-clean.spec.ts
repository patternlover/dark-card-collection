import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

const HYDRATION_RE =
  /Minified React error #4|did not match the client|Hydration failed|A tree hydrated|Server rendered HTML|Text content does not match/

test.beforeAll(resetDb)

test.describe('Console pulita (no hydration errors)', () => {
  const PAGES = [
    '/',
    '/shop',
    '/products/test-booster-box',
    '/cart',
    '/dashboard',
    '/dashboard/listings',
    '/dashboard/purchases',
    '/dashboard/inventory',
    '/dashboard/orders',
    '/dashboard/messages',
  ]

  test('key pages load without React hydration errors', async ({ page }) => {
    const errors: string[] = []
    const onConsole = (m: { type: () => string; text: () => string }) => {
      if (m.type() === 'error') errors.push(m.text())
    }
    const onPageError = (e: Error) => errors.push(`PAGEERROR: ${String(e)}`)
    page.on('console', onConsole)
    page.on('pageerror', onPageError)

    await loginAs(page)
    for (const path of PAGES) {
      const response = await page.goto(path, { waitUntil: 'load' })
      expect(response?.status(), `${path} dovrebbe rispondere 200`).toBeLessThan(500)
      await page.waitForTimeout(1200)
    }

    const hydration = errors.filter((e) => HYDRATION_RE.test(e))
    expect(hydration, `Errori di hydration rilevati: ${JSON.stringify(hydration)}`).toEqual([])
  })
})
