import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Auth gate', () => {
  test('shows the Google login screen without a session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Accedi con il tuo account Google autorizzato.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Accedi con Google' })).toBeVisible()
  })

  test('does not grant access with an invalid session cookie', async ({ page }) => {
    await page.context().addCookies([
      { name: 'dcc-dash', value: 'google:test@example.com.0.invalid', url: 'http://localhost:3000' },
    ])
    await page.goto('/dashboard')
    await expect(page.getByText('Accedi con il tuo account Google autorizzato.')).toBeVisible()
  })

  test('grants access to the dashboard with a valid session', async ({ page }) => {
    await loginAs(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Panoramica' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Lotti' })).toBeVisible()
  })
})
