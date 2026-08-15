import { test, expect } from '@playwright/test'
import { createProductViaLot, loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
const TITLE = `E2E Box ${stamp}`
const LOT_SRC = `Lot ${TITLE}`

test.beforeAll(resetDb)

test.describe('Prodotti: Magazzino + Listati', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('create a product via a lot', async ({ page }) => {
    await createProductViaLot(page, { title: TITLE, quantity: '4', price: '99.90', sourceName: LOT_SRC })
    await page.goto('/dashboard/inventory')
    await expect(page.locator('tr', { hasText: TITLE }).first()).toBeVisible()
  })

  test('hide a product from the listino and verify it leaves the storefront', async ({ page }) => {
    await page.goto('/dashboard/listings')
    const row = page.locator('tr', { hasText: TITLE }).first()
    await expect(row).toBeVisible()
    await row.locator('button[title="Nascondi dallo shop (tutte le varianti)"]').click()
    await expect(row.locator('button[title="Mostra nello shop (tutte le varianti)"]')).toBeVisible()
    await page.reload()
    await expect(page.locator('tr', { hasText: TITLE }).first().locator('button[title="Mostra nello shop (tutte le varianti)"]')).toBeVisible()

    await page.goto('/shop')
    await expect(page.getByText(TITLE, { exact: true })).toHaveCount(0)
  })

  test('make a product visible again and show it on the storefront', async ({ page }) => {
    await page.goto('/dashboard/listings')
    const row = page.locator('tr', { hasText: TITLE }).first()
    await row.locator('button[title="Mostra nello shop (tutte le varianti)"]').click()
    await expect(row.locator('button[title="Nascondi dallo shop (tutte le varianti)"]')).toBeVisible()
    await page.reload()
    await expect(page.locator('tr', { hasText: TITLE }).first().locator('button[title="Nascondi dallo shop (tutte le varianti)"]')).toBeVisible()

    await page.goto('/shop')
    await expect(page.getByText(TITLE, { exact: true }).first()).toBeVisible()
  })

  test('edit a product price from the Listati', async ({ page }) => {
    await page.goto('/dashboard/listings')
    const row = page.locator('tr', { hasText: TITLE }).first()
    await row.locator('button[title="Modifica"]').click()
    await page.locator('#ep-price').fill('79.90')
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Prodotto salvato')).toBeVisible()
    await page.reload()
    await expect(page.locator('tr', { hasText: TITLE }).first()).toContainText('79,90')
  })

  test('toggle featured from the Listati', async ({ page }) => {
    await page.goto('/dashboard/listings')
    const row = page.locator('tr', { hasText: TITLE }).first()
    await row.locator('button[title="Metti in vetrina (bestseller)"]').click()
    await expect(row.locator('button[title="Togli dalla vetrina"]')).toBeVisible()
    await page.reload()
    await expect(page.locator('tr', { hasText: TITLE }).first().locator('button[title="Togli dalla vetrina"]')).toBeVisible()
  })

  test('delete a product from Magazzino', async ({ page }) => {
    page.on('dialog', (d) => d.accept())
    await page.goto('/dashboard/purchases')
    await page.locator('tr', { hasText: LOT_SRC }).first().locator('button[title="Elimina lotto"]').click()
    await expect(page.getByText('Lotto eliminato')).toBeVisible()
    await page.goto('/dashboard/inventory')
    const row = page.locator('tr', { hasText: TITLE }).first()
    await row.locator('button[title="Elimina prodotto"]').click()
    await expect(page.getByText('Prodotto eliminato')).toBeVisible()
    await page.reload()
    await expect(page.locator('tr', { hasText: TITLE }).first()).toHaveCount(0)
  })
})
