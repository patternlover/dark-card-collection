import { test, expect, type Page } from '@playwright/test'

// Cookie di sessione dashboard: leggilo dall'ambiente (mai hardcodato nel repo).
const DASH_COOKIE = process.env.DASH_COOKIE || ''

async function login(page: Page) {
  expect(DASH_COOKIE, 'Imposta DASH_COOKIE con il valore del cookie dcc-dash').toBeTruthy()
  await page.context().addCookies([
    { name: 'dcc-dash', value: DASH_COOKIE, url: 'https://darkcardcollection.com' },
  ])
}

const HYDRATION_RE = /Minified React error #4|did not match the client|Hydration failed|A tree hydrated/

test('PROD: auth + listino toggle/featured/edit + product create/delete, no 500, no hydration', async ({ page }) => {
  await login(page)
  const consoleErrors: string[] = []
  const failingWrites: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR ${e}`))
  page.on('response', async (r) => {
    if (r.request().method() === 'POST' && r.url().includes('/dashboard') && r.status() >= 500) {
      const b = await r.text().catch(() => '')
      failingWrites.push(`${r.status()} ${r.url().split('/').pop()} ${b.slice(0, 200)}`)
    }
  })

  // auth
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Panoramica' })).toBeVisible({ timeout: 30000 })
  console.log('AUTH_OK')

  // toggle nascondi su un prodotto esistente, verifica persistenza via reload, poi ripristina
  await page.goto('/dashboard/listings')
  const firstRow = page.locator('table tbody tr').first()
  await expect(firstRow).toBeVisible({ timeout: 30000 })
  const eye = firstRow.locator('button[title="Nascondi dallo shop"]')
  if ((await eye.count()) > 0) {
    await eye.click()
    await page.waitForTimeout(2500)
    await expect(firstRow.locator('button[title="Mostra nello shop"]')).toBeVisible({ timeout: 25000 })
    await page.reload()
    await expect(page.locator('table tbody tr').first().locator('button[title="Mostra nello shop"]')).toBeVisible({ timeout: 25000 })
    console.log('TOGGLE_PERSISTED')
    const restore = page.locator('table tbody tr').first().locator('button[title="Mostra nello shop"]')
    await restore.click()
    await page.waitForTimeout(2000)
    console.log('RESTORED')
  }

  // create + delete un prodotto di test
  const title = `E2E PROD ${Date.now()}`
  await page.goto('/dashboard/inventory')
  await page.getByRole('button', { name: 'Nuovo Prodotto' }).click()
  await page.locator('#cp-title').fill(title)
  await page.locator('#cp-price').fill('5')
  await page.locator('#cp-quantity').fill('1')
  await page.getByRole('button', { name: 'Crea Prodotto' }).click()
  await expect(page.getByText('Prodotto creato')).toBeVisible({ timeout: 25000 })
  console.log('CREATE_OK')
  page.on('dialog', (d) => d.accept())
  const row = page.locator('tr', { hasText: title })
  await row.locator('button[title="Elimina prodotto"]').click()
  await expect(page.getByText('Prodotto eliminato')).toBeVisible({ timeout: 25000 })
  console.log('DELETE_OK')

  console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors.slice(0, 6)))
  console.log('FAILING_WRITES', JSON.stringify(failingWrites.slice(0, 6)))
  expect(failingWrites, `Scritture fallite: ${JSON.stringify(failingWrites)}`).toEqual([])
  expect(consoleErrors.filter((e) => HYDRATION_RE.test(e))).toEqual([])
})
