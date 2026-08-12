import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
let n = 0
const title = (name: string) => `${name} ${stamp}-${++n}`

test.beforeAll(resetDb)

test.describe('Listino: gruppi per nome, nomi completi, disponibilità e filtri', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  async function createProduct(page: any, name: string, quantity: string, price = '25') {
    await page.goto('/dashboard/inventory')
    await page.getByRole('button', { name: 'Nuovo Prodotto' }).click()
    await page.locator('#cp-title').fill(name)
    await page.locator('#cp-price').fill(price)
    await page.locator('#cp-quantity').fill(quantity)
    await page.getByRole('button', { name: 'Crea Prodotto' }).click()
    await expect(page.getByText('Prodotto creato')).toBeVisible()
  }

  test('full product names are shown (no truncation)', async ({ page }) => {
    const longName = title('Collezione Illustrazione Primi Compagni d\'Avventura con un titolo molto lungo per il test')
    await createProduct(page, longName, '2')
    await page.goto('/dashboard/listings')
    await expect(page.getByText(longName, { exact: true }).first()).toBeVisible()
  })

  test('shows quantity, availability badge and hides the whole group', async ({ page }) => {
    const inStock = title('Scatola In Stock')
    const out = title('Scatola Esaurita')
    await createProduct(page, inStock, '3', '30')
    await createProduct(page, out, '0', '10')

    await page.goto('/dashboard/listings')
    const rowIn = page.locator('tr', { hasText: inStock }).first()
    await expect(rowIn).toContainText('3')
    await expect(rowIn.getByText('In stock', { exact: true })).toBeVisible()
    const rowOut = page.locator('tr', { hasText: out }).first()
    await expect(rowOut).toContainText('0')
    await expect(rowOut.getByText('Esaurito (OOS)', { exact: true })).toBeVisible()

    await rowOut.locator('button[title="Nascondi dallo shop (tutte le varianti)"]').click()
    await expect(rowOut.locator('button[title="Mostra nello shop (tutte le varianti)"]')).toBeVisible()
    await page.reload()
    await expect(page.locator('tr', { hasText: out }).first().locator('button[title="Mostra nello shop (tutte le varianti)"]')).toBeVisible()

    await page.goto('/shop')
    await expect(page.getByText(out, { exact: true })).toHaveCount(0)
  })

  test('variants with the same title are grouped as flat rows (no sub-table)', async ({ page }) => {
    const groupName = title('Doppio Variante')
    await createProduct(page, groupName, '2', '50')
    await createProduct(page, groupName, '1', '45')

    await page.goto('/dashboard/listings')
    const groupRow = page.locator('tr', { hasText: groupName }).first()
    await expect(groupRow).toContainText('3')
    await expect(groupRow).toContainText('45,00 €')
    await expect(page.locator('tr', { hasText: groupName }).locator('button[title="Modifica variante"]')).toHaveCount(2)
    await expect(page.locator('tr', { hasText: groupName }).locator('button[title="Modifica variante"]').first()).toBeVisible()
  })

  test('shows the sold counter on the group row', async ({ page }) => {
    const sold = title('Venduto Su Vinted')
    await createProduct(page, sold, '2', '60')

    await page.goto('/dashboard/orders')
    await page.getByRole('button', { name: 'Registra Vendita Esterna' }).click()
    const opt = page.locator('#ext-product option', { hasText: sold }).first()
    await page.locator('#ext-product').selectOption(await opt.getAttribute('value'))
    await page.locator('#ext-platform').selectOption({ label: 'Vinted' })
    await page.locator('#ext-qty').fill('1')
    await page.locator('#ext-price').fill('55')
    await page.getByRole('button', { name: 'Registra Vendita', exact: true }).click()
    await expect(page.locator('#ext-product')).not.toBeVisible()

    await page.goto('/dashboard/listings')
    const row = page.locator('tr', { hasText: sold }).first()
    await expect(row).toContainText('×1')
  })
})
