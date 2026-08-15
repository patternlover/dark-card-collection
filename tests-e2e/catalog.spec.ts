import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

const stamp = Date.now()

test.beforeAll(resetDb)

test.describe('Espansioni', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('creates, edits and deletes an espansione', async ({ page }) => {
    const name = `E2E Col ${stamp}`
    const renamed = `${name} Renamed`

    await page.goto('/dashboard/expansions')
    await page.getByRole('button', { name: 'Nuova Espansione' }).click()
    await page.locator('#expansion-name').fill(name)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Espansione creata')).toBeVisible()
    await expect(page.locator('tr', { hasText: name })).toBeVisible()

    await page.getByRole('button', { name: `Modifica ${name}` }).click()
    await page.locator('#expansion-name').fill(renamed)
    await page.getByRole('button', { name: 'Salva' }).click()
    await expect(page.getByText('Espansione aggiornata')).toBeVisible()

    page.on('dialog', (d) => d.accept())
    await page.getByRole('button', { name: `Elimina ${renamed}` }).click()
    await expect(page.getByText('Espansione eliminata')).toBeVisible()
    await expect(page.locator('tr', { hasText: renamed })).toHaveCount(0)
  })
})
