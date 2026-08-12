import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

test.beforeAll(resetDb)

test.describe('Impostazioni', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('updates the site settings and persists them', async ({ page }) => {
    const name = `Dark Card Test ${Date.now()}`
    await page.goto('/dashboard/impostazioni')
    await page.locator('#site-name').fill(name)
    await page.getByRole('button', { name: 'Salva' }).first().click()
    await expect(page.getByText('Impostazioni salvate')).toBeVisible()

    await page.reload()
    await expect(page.locator('#site-name')).toHaveValue(name)
  })

  test('adds a header nav item and persists it', async ({ page }) => {
    await page.goto('/dashboard/impostazioni')
    const label = 'Contatti E2E'
    const url = '/info/contact'
    await page.locator('input[placeholder="Etichetta"]').first().fill(label)
    await page.locator('input[placeholder="/pagina"]').first().fill(url)
    await page.getByRole('button', { name: 'Salva' }).last().click()
    await expect(page.getByText('Impostazioni salvate')).toBeVisible()

    await page.reload()
    await expect(page.locator('input[placeholder="Etichetta"]').first()).toHaveValue(label)
  })
})
