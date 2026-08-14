import { test, expect } from '@playwright/test'
import { createProductViaLot, loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()
let n = 0
const title = (name: string) => `${name} ${stamp}-${++n}`

test.beforeAll(resetDb)

test.describe('item_category (macro/espansione/micro) + modale Listati + redirect', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  async function createViaLot(page: any, name: string) {
    await createProductViaLot(page, { title: name, quantity: '1', price: '20' })
  }

  async function createCardViaLot(page: any, name: string) {
    await page.goto('/dashboard/purchases')
    await page.getByRole('button', { name: 'Registra Lotto' }).click()
    const line = page.getByTestId('purchase-line').nth(0)
    await line.getByTestId('line-product').selectOption('__new__')
    await line.locator('input[placeholder="Titolo nuovo prodotto *"]').fill(name)
    await line.locator('select').filter({ has: page.locator('option:has-text("Macro: Carta")') }).selectOption({ label: 'Macro: Carta' })
    await line.locator('select').filter({ has: page.locator('option:has-text("Slab")') }).selectOption({ label: 'Slab' })
    await line.getByTestId('line-quantity').fill('1')
    await line.getByTestId('line-cost').fill('15')
    await page.getByRole('button', { name: 'Registra e Carica in Inventario' }).click()
    await expect(page.getByText('Lotto registrato e inventario aggiornato con successo')).toBeVisible()
  }

  async function openEditInListati(page: any, name: string) {
    await page.goto('/dashboard/listati')
    await page.getByRole('button', { name: 'Prodotti' }).click()
    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="Modifica"]').click()
    await expect(page.getByText('Modifica Prodotto')).toBeVisible()
  }

  test('edit modal: minimal, no classification fields, no checkboxes, Google collapsible, slug Auto', async ({ page }) => {
    const name = title('Listati Minimale')
    await createViaLot(page, name)
    await openEditInListati(page, name)

    await expect(page.getByText('Dettagli prodotto')).toBeVisible()
    await expect(page.getByText('Dettagli carta')).toHaveCount(0)

    await expect(page.locator('#ep-item-category-1')).toHaveCount(0)
    await expect(page.getByText('Macro prodotto', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Espansione', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Micro prodotto', { exact: true })).toHaveCount(0)
    await expect(page.locator('#ep-cogs')).toHaveCount(0)
    await expect(page.locator('#ep-quantity')).toHaveCount(0)
    await expect(page.getByText('In Evidenza', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Visibile nello shop', { exact: true })).toHaveCount(0)

    await expect(page.getByText('Google / Merchant Center', { exact: true })).toHaveCount(0)
    await page.getByText('Inserisci dati Google / Merchant Center').click()
    await expect(page.getByText('Google / Merchant Center', { exact: true })).toBeVisible()
    await page.locator('#ep-item-group').fill('GRP-001')

    const slug = page.locator('#ep-slug')
    await expect(slug).toBeDisabled()
    await expect(slug.locator('..').getByText('Auto')).toBeVisible()

    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Prodotto salvato')).toBeVisible()
  })

  test('card created from lot shows Dettagli carta in the edit modal (persisted)', async ({ page }) => {
    const name = title('Carta Listati')
    await createCardViaLot(page, name)
    await openEditInListati(page, name)
    await expect(page.getByText('Dettagli carta')).toBeVisible()
    await expect(page.getByText('Dettagli prodotto')).toHaveCount(0)
    await page.locator('#ep-grade').selectOption({ label: 'Near Mint' })
    await page.locator('#ep-language').selectOption({ label: 'Inglese' })
    await page.locator('#ep-card-number').fill('025/165')
    await page.locator('#ep-rarity').selectOption({ label: 'Ultra Rare' })
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Prodotto salvato')).toBeVisible()

    await openEditInListati(page, name)
    await expect(page.getByText('Dettagli carta')).toBeVisible()
    await page.getByRole('button', { name: 'Annulla' }).click()
  })

  test('shop shows Carta/Prodotto badges', async ({ page }) => {
    const card = title('Badge Carta')
    const prod = title('Badge Prodotto')
    await createCardViaLot(page, card)
    await createViaLot(page, prod)

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

  test('/dashboard/listings redirects to /dashboard/listati', async ({ page }) => {
    await page.goto('/dashboard/listings')
    await expect(page).toHaveURL(/\/dashboard\/listati/)
  })
})
