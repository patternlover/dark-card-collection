import { test, expect } from '@playwright/test'
import { createProductViaLot, loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
const SRC = `Flow Source ${stamp}`

test.beforeAll(resetDb)

test.describe('Flussi modali tra pagine (dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('Lotto crea automaticamente il prodotto in Magazzino con quantità, prezzo e stato corretti', async ({ page }) => {
    const name = `Flow Auto ${stamp}`
    await createProductViaLot(page, {
      title: name,
      quantity: '4',
      price: '99.90',
      cost: '30',
      sourceName: SRC,
      expansion: 'Test Set',
    })

    await page.goto('/dashboard/inventory')
    const row = page.locator('tr', { hasText: name }).first()
    await expect(row).toBeVisible()
    await expect(row).toContainText('4')
    await expect(row).toContainText('99,90')

    await page.goto('/dashboard/listings')
    const lrow = page.locator('tr', { hasText: name }).first()
    await expect(lrow.getByText('In stock', { exact: true })).toBeVisible()
  })

  test('Magazzino non ha più il bottone Nuovo Prodotto (i prodotti arrivano dai Lotti)', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await expect(page.getByRole('button', { name: 'Nuovo Prodotto' })).toHaveCount(0)
  })

  test('Luogo/Fornitore: il combobox suggerisce i luoghi già usati', async ({ page }) => {
    // SRC è stato usato nel lotto del primo test
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    await expect(page.locator(`#pc-source-list option[value="${SRC}"]`)).toHaveCount(1)
  })

  test('gli errori di validazione appaiono dentro il modale, non sulla pagina', async ({ page }) => {
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    await page.locator('#pc-date').fill('')
    await page.getByRole('button', { name: 'Registra e Carica in Inventario' }).click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog.getByText('Data non valida: usa il formato GG/MM/AAAA')).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('Vendita Esterna scala lo stock in Magazzino', async ({ page }) => {
    await page.goto('/dashboard/orders')
    await page.getByRole('button', { name: 'Registra Vendita' }).click()
    const opt = page.locator('#ext-product option', { hasText: 'Test ETB' }).first()
    await page.locator('#ext-product').selectOption(await opt.getAttribute('value'))
    await page.locator('#ext-qty').fill('1')
    await page.locator('#ext-price').fill('60')
    await page.getByRole('button', { name: 'Registra Vendita', exact: true }).click()
    await expect(page.locator('#ext-product')).not.toBeVisible()

    await page.goto('/dashboard/inventory')
    const row = page.locator('tr', { hasText: 'Test ETB' }).first()
    await expect(row).toContainText('2')
  })

  test('ciclo stock: venduto fino a 0 → Esaurito/Venduto, nuovo lotto → ripristino', async ({ page }) => {
    const name = `Flow Life ${stamp}`
    await createProductViaLot(page, { title: name, quantity: '2', price: '50', cost: '20' })

    // vendita totale → stock 0
    await page.goto('/dashboard/orders')
    await page.getByRole('button', { name: 'Registra Vendita' }).click()
    const opt = page.locator('#ext-product option', { hasText: name }).first()
    await page.locator('#ext-product').selectOption(await opt.getAttribute('value'))
    await page.locator('#ext-qty').fill('2')
    await page.locator('#ext-price').fill('45')
    await page.getByRole('button', { name: 'Registra Vendita', exact: true }).click()
    await expect(page.locator('#ext-product')).not.toBeVisible()

    await page.goto('/dashboard/inventory')
    const row0 = page.locator('tr', { hasText: name }).first()
    await expect(row0).toContainText('0')

    await page.goto('/dashboard/listings')
    const lrow0 = page.locator('tr', { hasText: name }).first()
    await expect(lrow0.getByText('Esaurito', { exact: true })).toBeVisible()

    // nuovo lotto → ripristina lo stock
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    const line = page.getByTestId('purchase-line').nth(0)
    await line.getByTestId('line-product').selectOption({ label: name })
    await line.getByTestId('line-quantity').fill('1')
    await line.getByTestId('line-cost').fill('20')
    await page.getByRole('button', { name: 'Registra e Carica in Inventario' }).click()
    await expect(page.getByText('Lotto registrato e inventario aggiornato con successo')).toBeVisible()

    await page.goto('/dashboard/inventory')
    const row1 = page.locator('tr', { hasText: name }).first()
    await expect(row1).toContainText('1')

    await page.goto('/dashboard/listings')
    const lrow1 = page.locator('tr', { hasText: name }).first()
    await expect(lrow1.getByText('In stock', { exact: true })).toBeVisible()
  })

  test('il modale Espansione crea voci che compaiono nel modale Lotto', async ({ page }) => {
    const col = `Flow Col ${stamp}`

    await page.goto('/dashboard/expansions')
    await page.getByRole('button', { name: 'Nuova Espansione' }).click()
    await page.locator('#expansion-name').fill(col)
    await page.getByRole('button', { name: 'Salva', exact: true }).click()
    await expect(page.getByText('Espansione creata')).toBeVisible()

    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    const line = page.getByTestId('purchase-line').nth(0)
    await line.getByTestId('line-product').selectOption('__new__')
    await expect(line.locator('select').nth(1).locator('option', { hasText: col })).toHaveCount(1)
  })
})
