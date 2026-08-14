import { test, expect } from '@playwright/test'
import { createProductViaLot, loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
let n = 0
const title = (name: string) => `${name} ${stamp}-${++n}`

test.beforeAll(resetDb)

test.describe('item_category: carta vs prodotto (modale Listino) + badge + redirect espansioni', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  async function createViaLot(page: any, name: string) {
    await createProductViaLot(page, { title: name, quantity: '1', price: '20' })
  }

  async function openEditInListino(page: any, name: string) {
    await page.goto('/dashboard/listings')
    await page.getByRole('button', { name: 'Prodotti' }).click()
    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="Modifica"]').click()
    await expect(page.getByText('Modifica Prodotto')).toBeVisible()
  }

  test('product modal shows only the Dettagli prodotto section', async ({ page }) => {
    const name = title('Sigillato Prova')
    await createViaLot(page, name)
    await openEditInListino(page, name)
    await expect(page.getByText('Dettagli prodotto')).toBeVisible()
    await expect(page.getByText('Dettagli carta')).toHaveCount(0)
    await page.getByRole('button', { name: 'Annulla' }).click()
  })

  test('switching to Carta shows only Dettagli carta (grade, language, rarity)', async ({ page }) => {
    const name = title('Carta Prova')
    await createViaLot(page, name)
    await openEditInListino(page, name)

    await page.locator('#ep-item-category-1').selectOption('card')
    await expect(page.getByText('Dettagli carta')).toBeVisible()
    await expect(page.getByText('Dettagli prodotto')).toHaveCount(0)
    await page.locator('#ep-grade').selectOption({ label: 'Near Mint' })
    await page.locator('#ep-language').selectOption({ label: 'Inglese' })
    await page.locator('#ep-card-number').fill('025/165')
    await page.locator('#ep-rarity').selectOption({ label: 'Ultra Rare' })
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Prodotto salvato')).toBeVisible()

    await openEditInListino(page, name)
    await expect(page.getByText('Dettagli carta')).toBeVisible()
    await expect(page.getByText('Dettagli prodotto')).toHaveCount(0)
    await page.getByRole('button', { name: 'Annulla' }).click()
  })

  test('shop shows Carta/Prodotto badges', async ({ page }) => {
    const card = title('Badge Carta')
    const prod = title('Badge Prodotto')
    await createViaLot(page, card)
    await createViaLot(page, prod)

    await openEditInListino(page, card)
    await page.locator('#ep-item-category-1').selectOption('card')
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Prodotto salvato')).toBeVisible()

    await page.goto('/shop')
    const cardEl = page.locator('.group', { hasText: card }).first()
    await expect(cardEl.getByText('Carta', { exact: true })).toBeVisible()
    const prodEl = page.locator('.group', { hasText: prod }).first()
    await expect(prodEl.getByText('Prodotto', { exact: true })).toBeVisible()
  })

  test('/shop/collections redirects to /shop/espansioni', async ({ page }) => {
    await page.goto('/shop/collections')
    await expect(page).toHaveURL(/\/shop\/espansioni/)
  })

  test('edit modal: no featured/visible checkboxes, Google section collapsible, auto fields', async ({ page }) => {
    const name = title('Restyle Prova')
    await createViaLot(page, name)
    await openEditInListino(page, name)

    await expect(page.getByText('In Evidenza', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Visibile nello shop', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Google / Merchant Center', { exact: true })).toHaveCount(0)

    await page.getByText('Inserisci dati Google / Merchant Center').click()
    await expect(page.getByText('Google / Merchant Center', { exact: true })).toBeVisible()
    await page.locator('#ep-item-group').fill('GRP-001')

    const slug = page.locator('#ep-slug')
    await expect(slug).toBeDisabled()
    await expect(slug.locator('..').getByText('Auto')).toBeVisible()
    const cogs = page.locator('#ep-cogs')
    await expect(cogs).toBeDisabled()
    await expect(cogs.locator('..').getByText('Auto')).toBeVisible()

    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Prodotto salvato')).toBeVisible()
  })

  test('lotto quick-create selects tipo articolo (Carta) and it shows on the shop', async ({ page }) => {
    const name = title('Carta Da Lotto')
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    const line = page.getByTestId('purchase-line').nth(0)
    await line.getByTestId('line-product').selectOption('__new__')
    await line.locator('input[placeholder="Titolo nuovo prodotto *"]').fill(name)
    await line.locator('select').filter({ has: page.locator('option:has-text("Tipo: Carta")') }).selectOption({ label: 'Tipo: Carta' })
    await line.locator('select').filter({ has: page.locator('option:has-text("SLAB")') }).selectOption({ label: 'SLAB' })
    await line.getByTestId('line-quantity').fill('1')
    await line.getByTestId('line-cost').fill('15')
    await page.getByRole('button', { name: 'Registra e Carica in Inventario' }).click()
    await expect(page.getByText('Lotto registrato e inventario aggiornato con successo')).toBeVisible()

    await page.goto('/shop')
    const el = page.locator('.group', { hasText: name }).first()
    await expect(el.getByText('Carta', { exact: true })).toBeVisible()
  })
})

