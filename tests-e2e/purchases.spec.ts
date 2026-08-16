import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
const SHOP = `E2E Shop ${stamp}`
const NEW_PROD = `E2E New Lot Product ${stamp}`

test.beforeAll(resetDb)

test.describe('Lotti (purchases)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('creates a lot with an existing-product line and a quick-created product', async ({ page }) => {
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()

    await page.locator('#pc-source-name').fill(SHOP)

    // riga 1: prodotto esistente 'Test ETB'
    const line1 = page.getByTestId('purchase-line').nth(0)
    await line1.getByTestId('line-product').selectOption({ label: 'Test ETB' })
    await line1.getByTestId('line-quantity').fill('2')
    await line1.getByTestId('line-cost').fill('40')

    // riga 2: nuovo prodotto (quick-create)
    await page.getByRole('button', { name: 'Aggiungi riga' }).click()
    const line2 = page.getByTestId('purchase-line').nth(1)
    await line2.getByTestId('line-product').selectOption('__new__')
    await line2.locator('input[placeholder="Titolo nuovo prodotto"]').fill(NEW_PROD)
    await line2.getByTestId('line-quantity').fill('3')
    await line2.getByTestId('line-cost').fill('15')

    await page.getByRole('button', { name: 'Registra e Carica in Magazzino' }).click()
    await expect(page.getByText('Lotto registrato e magazzino aggiornato con successo')).toBeVisible()
    await expect(page.locator('tr', { hasText: SHOP })).toBeVisible()
  })

  test('stock increases in Magazzino after the lot (Test ETB 3 → 5)', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    const row = page.locator('tr', { hasText: 'Test ETB' })
    await expect(row).toContainText('5')
  })

  test('quick-created product appears in Magazzino with the lot stock', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    const row = page.locator('tr', { hasText: NEW_PROD })
    await expect(row).toBeVisible()
    await expect(row).toContainText('3')
  })

  test('edits a lot: quantity change updates stock (Test ETB 5 → 6)', async ({ page }) => {
    await page.goto('/dashboard/purchases')
    const row = page.locator('tr', { hasText: SHOP })
    await row.locator('button[title="Modifica lotto"]').click()
    const line1 = page.getByTestId('purchase-line').nth(0)
    await line1.getByTestId('line-quantity').fill('3')
    await page.getByRole('button', { name: 'Salva Modifiche' }).click()
    await expect(page.getByText('Lotto aggiornato e magazzino riconciliato')).toBeVisible()

    await page.goto('/dashboard/inventory')
    const etb = page.locator('tr', { hasText: 'Test ETB' })
    await expect(etb).toContainText('6')
  })

  test('expands a lot and shows its lines', async ({ page }) => {
    await page.goto('/dashboard/purchases')
    const row = page.locator('tr', { hasText: SHOP })
    await row.locator('td').last().locator('button').first().click()
    await expect(page.getByText(NEW_PROD)).toBeVisible()
  })

  test('deletes a lot and removes the residual stock', async ({ page }) => {
    page.on('dialog', (d) => d.accept())
    await page.goto('/dashboard/purchases')
    const row = page.locator('tr', { hasText: SHOP })
    await row.locator('button[title="Elimina lotto"]').click()
    await expect(page.getByText('Lotto eliminato')).toBeVisible()
    await expect(page.locator('tr', { hasText: SHOP })).toHaveCount(0)
  })

  test('dropdown prodotto: una riga per gruppo, select Variante per titoli con più prodotti', async ({ page }) => {
    const name = `E2E Group ${stamp}`
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()

    // due righe quick-create con lo stesso titolo → 2 prodotti, 1 gruppo
    const line1 = page.getByTestId('purchase-line').nth(0)
    await line1.getByTestId('line-product').selectOption('__new__')
    await line1.locator('input[placeholder="Titolo nuovo prodotto"]').fill(name)
    await line1.getByTestId('line-quantity').fill('1')
    await line1.getByTestId('line-cost').fill('10')

    await page.getByRole('button', { name: 'Aggiungi riga' }).click()
    const line2 = page.getByTestId('purchase-line').nth(1)
    await line2.getByTestId('line-product').selectOption('__new__')
    await line2.locator('input[placeholder="Titolo nuovo prodotto"]').fill(name)
    await line2.getByTestId('line-quantity').fill('1')
    await line2.getByTestId('line-cost').fill('12')

    await page.getByRole('button', { name: 'Registra e Carica in Magazzino' }).click()
    await expect(page.getByText('Lotto registrato e magazzino aggiornato con successo')).toBeVisible()

    // riaperto il modal: il dropdown mostra UNA riga per il gruppo
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    const line = page.getByTestId('purchase-line').nth(0)
    await expect(line.getByTestId('line-product').locator('option', { hasText: name })).toHaveCount(1)
    await line.getByTestId('line-product').selectOption({ label: name })

    // e compare il select Variante con le 2 opzioni
    const variantSelect = line.getByTestId('line-variant')
    await expect(variantSelect).toBeVisible()
    await expect(variantSelect.locator('option')).toHaveCount(2)
  })
})
