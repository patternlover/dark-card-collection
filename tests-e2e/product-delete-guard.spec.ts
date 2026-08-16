import { test, expect } from '@playwright/test'
import { createProductViaLot, loginAs } from '../tests-e2e/helpers'
import { resetDb } from '../tests-e2e/reset-db'

const stamp = Date.now()
let titleCounter = 0
const title = () => `Repro Del ${stamp}-${++titleCounter}`

test.beforeAll(resetDb)

test.describe('Delete prodotto: guardie integrità (nessun 500/#441)', () => {
  let errors: string[] = []

  test.beforeEach(async ({ page }) => {
    errors = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e)}`))
    page.on('dialog', (d) => d.accept())
    await loginAs(page)
  })

  async function createProduct(page: any, name: string, quantity: string) {
    await createProductViaLot(page, { title: name, quantity, price: '50', sourceName: `Lot ${name}` })
  }

  async function addLot(page: any, name: string) {
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    const line = page.getByTestId('purchase-line').nth(0)
    await line.getByTestId('line-product').selectOption({ label: name })
    await line.getByTestId('line-quantity').fill('2')
    await line.getByTestId('line-cost').fill('20')
    await page.getByRole('button', { name: 'Registra e Carica in Inventario' }).click()
    await expect(page.getByText('Lotto registrato e inventario aggiornato con successo')).toBeVisible()
  }

  async function registerSale(page: any, name: string, qty: string) {
    await page.goto('/dashboard/orders')
    await page.getByRole('button', { name: 'Registra Vendita' }).click()
    const optVal = await page.locator('#ext-product option', { hasText: name }).getAttribute('value')
    await page.locator('#ext-product').selectOption(optVal || '')
    await page.locator('#ext-qty').fill(qty)
    await page.locator('#ext-price').fill('60')
    await page.getByRole('button', { name: 'Registra Vendita', exact: true }).click()
    await expect(page.locator('#ext-product')).not.toBeVisible()
  }

  test('no references: plain delete works, no 441', async ({ page }) => {
    const t1 = title()
    await createProduct(page, t1, '1')
    // products come from lots: delete the lot first so the product has no references
    await page.goto('/dashboard/purchases')
    await page.locator('tr', { hasText: `Lot ${t1}` }).first().locator('button[title="Elimina lotto"]').click()
    await expect(page.getByText('Lotto eliminato')).toBeVisible()
    await page.goto('/dashboard/inventory')
    await page.locator('tr', { hasText: t1 }).locator('button[title="Elimina prodotto"]').click()
    await expect(page.getByText('Prodotto eliminato')).toBeVisible()
    await expect(page.locator('tr', { hasText: t1 })).toHaveCount(0)
    const hydration = errors.filter((e) => /Minified React error #441/.test(e))
    expect(hydration, `#441: ${JSON.stringify(hydration)}`).toEqual([])
  })

  test('residual lot stock: clear message, no 441, row stays', async ({ page }) => {
    const t2 = title()
    // lot-only creation: the lot that creates the product already holds residual stock
    await createProduct(page, t2, '2')
    await page.goto('/dashboard/inventory')
    await page.locator('tr', { hasText: t2 }).locator('button[title="Elimina prodotto"]').click()
    await expect(page.getByText(/Il prodotto ha stock residuo nei lotti/)).toBeVisible()
    await expect(page.locator('tr', { hasText: t2 })).toHaveCount(1)
    const hydration = errors.filter((e) => /Minified React error #441/.test(e))
    expect(hydration, `#441: ${JSON.stringify(hydration)}`).toEqual([])
  })

  test('order reference: clear message, no 441, row stays', async ({ page }) => {
    const t3 = title()
    await createProduct(page, t3, '2')
    await addLot(page, t3)
    await registerSale(page, t3, '1')
    await page.goto('/dashboard/inventory')
    await page.locator('tr', { hasText: t3 }).locator('button[title="Elimina prodotto"]').click()
    await expect(page.getByText(/Il prodotto risulta in ordini/)).toBeVisible()
    await expect(page.locator('tr', { hasText: t3 })).toHaveCount(1)
    const hydration = errors.filter((e) => /Minified React error #441/.test(e))
    expect(hydration, `#441: ${JSON.stringify(hydration)}`).toEqual([])
  })
})
