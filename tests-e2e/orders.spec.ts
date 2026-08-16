import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

test.beforeAll(resetDb)

test.describe('Ordini', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('shows the seeded order with channel and margin in the detail', async ({ page }) => {
    await page.goto('/dashboard/orders')
    const row = page.locator('tr', { hasText: 'test-order-1' })
    await expect(row).toContainText('Sito web')
    await expect(row).toContainText('600,00 €')
    await row.getByRole('button').first().click()
    await expect(page.getByText('Margine:')).toBeVisible()
    await expect(page.getByText('Canale:')).toBeVisible()
  })

  test('changes an order status', async ({ page }) => {
    await page.goto('/dashboard/orders')
    const row = page.locator('tr', { hasText: 'test-order-1' })
    await row.locator('select').selectOption('shipped')
    await expect(row.locator('select')).toHaveValue('shipped')
  })

  test('registers an external sale (order + stock)', async ({ page }) => {
    await page.goto('/dashboard/orders')
    await page.getByRole('button', { name: 'Registra Vendita' }).click()
    const option = page.locator('#ext-product option', { hasText: 'Test ETB' }).first()
    await page.locator('#ext-product').selectOption(await option.getAttribute('value'))
    await page.locator('#ext-platform').selectOption({ label: 'Vinted' })
    await page.locator('#ext-qty').fill('1')
    await page.locator('#ext-price').fill('50')
    await page.getByRole('button', { name: 'Registra Vendita', exact: true }).click()
    await expect(page.locator('tr', { hasText: 'Vinted' })).toBeVisible()
  })
})
