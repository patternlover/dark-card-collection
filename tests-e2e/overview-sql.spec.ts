import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'
import { resetDb } from './reset-db'

test.beforeAll(resetDb)

test.describe('Overview + SQL console (copertura E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('overview mostra le statistiche', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Panoramica' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible()
    await expect(page.getByText(/Valore inventario/)).toBeVisible()
    await expect(page.getByText(/Fatturato/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ultimi ordini' })).toBeVisible()
  })

  test('SQL console esegue una query read-only', async ({ page }) => {
    await page.goto('/dashboard/sql')
    await expect(page.getByRole('heading', { name: 'Query SQL' })).toBeVisible()
    await page.locator('textarea').fill('SELECT 1 AS uno;')
    await page.getByRole('button', { name: 'Esegui' }).click()
    await expect(page.getByRole('cell', { name: '1' })).toBeVisible()
    await expect(page.getByText('1 righe', { exact: true })).toBeVisible()
  })
})
