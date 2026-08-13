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
    await page.locator('#sale-email').fill('cliente@example.com')
    await page.getByRole('button', { name: 'Registra Vendita' }).click()
    await expect(page.getByText('Vendita registrata')).toBeVisible()

    await page.getByRole('button', { name: 'Gruppi prodotto' }).click()
    const group = page.locator('tr', { hasText: name }).first()
    await expect(group).toContainText('×1')
    await expect(group).toContainText('1')
  })

  test('products view: hiding then showing a product persists and shows on the shop', async ({ page }) => {
    const name = title('Mostra Di Nuovo')
    await createProduct(page, name, '2', '40')

    await page.goto('/dashboard/listings')
    await page.getByRole('button', { name: 'Prodotti' }).click()
    const row = page.locator('tr', { hasText: name }).first()

    await row.locator('button[title="Nascondi singolo prodotto"]').click()
    await expect(page.getByText('Prodotto nascosto dallo shop')).toBeVisible()
    await expect(row.locator('button[title="Mostra singolo prodotto"]')).toBeVisible()

    await row.locator('button[title="Mostra singolo prodotto"]').click()
    await expect(page.getByText('Prodotto visibile nello shop')).toBeVisible()
    await expect(row.locator('button[title="Nascondi singolo prodotto"]')).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Prodotti' }).click()
    await expect(page.locator('tr', { hasText: name }).first().locator('button[title="Nascondi singolo prodotto"]')).toBeVisible()

    await page.goto('/shop')
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  })

  test('featured slots: counter n/4 and star locked when full, homepage shows featured', async ({ page }) => {
    const names: string[] = []
    for (let i = 1; i <= 5; i++) {
      const n = title(`Evidenza ${i}`)
      names.push(n)
      await createProduct(page, n, '1', '10')
    }

    await page.goto('/dashboard/listings')
    const rowFor = (n: string) => page.locator('tr', { hasText: n }).first()

    for (let i = 0; i < 4; i++) {
      await rowFor(names[i]).locator('button[title="Metti in vetrina (bestseller)"]').click()
    }
    await expect(page.getByText(/In evidenza 4\/4/)).toBeVisible()

    const star5 = rowFor(names[4]).locator('button[title="Slot in evidenza pieni (4/4)"]')
    await expect(star5).toBeVisible()
    await expect(star5).toBeDisabled()

    await rowFor(names[0]).locator('button[title="Togli dalla vetrina"]').click()
    await expect(rowFor(names[4]).locator('button[title="Metti in vetrina (bestseller)"]')).toBeVisible()

    await page.goto('/')
    await expect(page.getByText(names[1], { exact: true }).first()).toBeVisible()
    await expect(page.getByText(names[0], { exact: true })).toHaveCount(0)
  })

  test('clicking a column header sorts asc then desc (no search bar)', async ({ page }) => {
    const a = title('Alfa Box')
    const b = title('Beta Box')
    const c = title('Gamma Box')
    await createProduct(page, a, '1', '70')
    await createProduct(page, b, '1', '10')
    await createProduct(page, c, '1', '200')

    await page.goto('/dashboard/listings')
    await expect(page.locator('input[placeholder="Cerca per nome prodotto..."]')).toHaveCount(0)

    const firstRowTitle = () => page.locator('tbody tr').first().locator('td').first().innerText()
    const orderOf = async (...names: string[]) => {
      const texts = await page.locator('tbody tr').evaluateAll((rows) => rows.map((r) => r.textContent || ''))
      return names.map((n) => texts.findIndex((t) => t.includes(n)))
    }

    await page.getByRole('button', { name: /^Prezzo/ }).click()
    await expect.poll(firstRowTitle).toContain('Beta')
    await expect.poll(async () => (await orderOf(b, a, c))[0] < (await orderOf(b, a, c))[1]).toBe(true)

    await page.getByRole('button', { name: /^Prezzo/ }).click()
    await expect.poll(firstRowTitle).toContain('Gamma')
    await expect.poll(async () => (await orderOf(c, a, b))[0] < (await orderOf(c, a, b))[1]).toBe(true)

    await page.getByRole('button', { name: /^Qty/ }).click()
    await expect.poll(async () => (await orderOf(a, b, c))[0] < (await orderOf(a, b, c))[1]).toBe(true)
  })
})
