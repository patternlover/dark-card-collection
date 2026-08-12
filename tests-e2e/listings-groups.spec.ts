import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
let n = 0
const title = (name: string) => `${name} ${stamp}-${++n}`

test.beforeAll(resetDb)

test.describe('Listino: viste Gruppi prodotto / Prodotti', () => {
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

  test('groups view (default): full product names shown, no truncation', async ({ page }) => {
    const longName = title('Collezione Illustrazione Primi Compagni d\'Avventura con un titolo molto lungo per il test')
    await createProduct(page, longName, '2')
    await page.goto('/dashboard/listings')
    await expect(page.getByText(longName, { exact: true }).first()).toBeVisible()
  })

  test('groups view: quantity, availability badge and hide whole group', async ({ page }) => {
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

  test('groups view: multi-variant groups are one row with aggregated qty (no Stato column)', async ({ page }) => {
    const groupName = title('Doppio')
    await createProduct(page, groupName, '2', '50')
    await createProduct(page, groupName, '1', '45')

    await page.goto('/dashboard/listings')
    await expect(page.locator('tr', { hasText: groupName })).toHaveCount(1)
    const row = page.locator('tr', { hasText: groupName }).first()
    await expect(row).toContainText('3')
    await expect(row).toContainText('45,00 €')
    await expect(page.locator('button[title="Modifica variante"]')).toHaveCount(0)
  })

  test('groups view: shows the sold counter on the group row', async ({ page }) => {
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

  test('products view: shows one row per item and hides a single item', async ({ page }) => {
    const name = title('Nascondi Singolo')
    await createProduct(page, name, '2', '50')

    await page.goto('/dashboard/listings')
    await page.getByRole('button', { name: 'Prodotti' }).click()
    const row = page.locator('tr', { hasText: name }).first()
    await expect(row.getByText('Disponibile', { exact: true })).toBeVisible()
    await row.locator('button[title="Nascondi singolo prodotto"]').click()
    await expect(page.getByText('Prodotto nascosto dallo shop')).toBeVisible()
    await expect(row.locator('button[title="Mostra singolo prodotto"]')).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Prodotti' }).click()
    await expect(page.locator('tr', { hasText: name }).first().locator('button[title="Mostra singolo prodotto"]')).toBeVisible()
  })

  test('products view: Vendi records a manual website sale and scales stock', async ({ page }) => {
    const name = title('Vendita Manuale')
    await createProduct(page, name, '2', '60')

    await page.goto('/dashboard/listings')
    await page.getByRole('button', { name: 'Prodotti' }).click()
    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="Vendi"]').click()
    await page.locator('#sale-qty').fill('1')
    await page.locator('#sale-price').fill('55')
    await page.getByRole('button', { name: 'Registra Vendita' }).click()
    await expect(page.getByText('Vendita registrata')).toBeVisible()

    await page.getByRole('button', { name: 'Gruppi prodotto' }).click()
    const group = page.locator('tr', { hasText: name }).first()
    await expect(group).toContainText('×1')
    await expect(group).toContainText('1')
  })

  test('live search without a Cerca button filters from the database', async ({ page }) => {
    const first = title('Zanzara')
    const second = title('Topo')
    await createProduct(page, first, '1', '10')
    await createProduct(page, second, '1', '20')

    await page.goto('/dashboard/listings')
    const search = page.locator('input[placeholder="Cerca per nome prodotto..."]')
    await search.fill(first.split(' ')[0]!)
    await expect(page.locator('tr', { hasText: first })).toHaveCount(1)
    await expect(page.locator('tr', { hasText: second })).toHaveCount(0)

    await search.fill('')
    await expect(page.locator('tr', { hasText: first })).toHaveCount(1)
    await expect(page.locator('tr', { hasText: second })).toHaveCount(1)
  })
})
