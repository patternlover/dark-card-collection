import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()

test.beforeAll(resetDb)

test.describe('Categorie', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('creates, edits and deletes a category', async ({ page }) => {
    const name = `E2E Cat ${stamp}`
    const renamed = `${name} Renamed`

    await page.goto('/dashboard/categorie')
    await page.getByRole('button', { name: 'Nuova Categoria' }).click()
    await page.locator('#category-name').fill(name)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Categoria creata')).toBeVisible()
    await expect(page.locator('tr', { hasText: name })).toBeVisible()

    await page.getByRole('button', { name: `Modifica ${name}` }).click()
    await page.locator('#category-name').fill(renamed)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Categoria aggiornata')).toBeVisible()
    await expect(page.locator('tr', { hasText: renamed })).toBeVisible()

    page.on('dialog', (d) => d.accept())
    await page.getByRole('button', { name: `Elimina ${renamed}` }).click()
    await expect(page.getByText('Categoria eliminata')).toBeVisible()
    await expect(page.locator('tr', { hasText: renamed })).toHaveCount(0)
  })
})

test.describe('Collezioni', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('creates, edits and deletes a collection', async ({ page }) => {
    const name = `E2E Col ${stamp}`
    const renamed = `${name} Renamed`

    await page.goto('/dashboard/collezioni')
    await page.getByRole('button', { name: 'Nuova Collezione' }).click()
    await page.locator('#collection-name').fill(name)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Collezione creata')).toBeVisible()
    await expect(page.locator('tr', { hasText: name })).toBeVisible()

    await page.getByRole('button', { name: `Modifica ${name}` }).click()
    await page.locator('#collection-name').fill(renamed)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Collezione aggiornata')).toBeVisible()

    page.on('dialog', (d) => d.accept())
    await page.getByRole('button', { name: `Elimina ${renamed}` }).click()
    await expect(page.getByText('Collezione eliminata')).toBeVisible()
    await expect(page.locator('tr', { hasText: renamed })).toHaveCount(0)
  })
})
