import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

test.beforeAll(resetDb)

test.describe('Messaggi', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('shows the seeded message', async ({ page }) => {
    await page.goto('/dashboard/messages')
    await expect(page.getByText('Messaggio di test')).toBeVisible()
  })

  test('expands a message and toggles read and replied', async ({ page }) => {
    await page.goto('/dashboard/messages')
    await page.getByText('Messaggio di test').click()

    await page.getByRole('button', { name: 'Segna come letto' }).click()
    await expect(page.getByRole('button', { name: 'Segna come non letto' })).toBeVisible()

    await page.getByRole('button', { name: 'Segna come risposto' }).click()
    await expect(page.getByRole('button', { name: 'Segna come non risposto' })).toBeVisible()
    await expect(page.getByText('Risposto', { exact: true })).toBeVisible()
  })

  test('deletes a message', async ({ page }) => {
    page.on('dialog', (d) => d.accept())
    await page.goto('/dashboard/messages')
    await page.getByText('Messaggio di test').click()
    await page.getByRole('button', { name: 'Elimina' }).click()
    await expect(page.getByText('Messaggio di test')).toHaveCount(0)
  })
})
