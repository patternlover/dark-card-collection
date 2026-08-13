import crypto from 'node:crypto'
import { expect, type Page } from '@playwright/test'

const SECRET = 'local-dash-session-secret-0001'
const COOKIE = 'dcc-dash'

export function dashToken(value: string): string {
  const data = `${value}.${Date.now()}`
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

export async function loginAs(page: Page, email = 'test@example.com'): Promise<void> {
  await page.context().addCookies([
    { name: COOKIE, value: dashToken(`google:${email}`), url: 'http://localhost:3100' },
  ])
}

export interface CreateProductViaLotOptions {
  title: string
  quantity: string
  price?: string
  cost?: string
  sourceName?: string
  category?: string
  collection?: string
}

// Products are created exclusively via Lotti (Registra Lotto → "Nuovo prodotto").
export async function createProductViaLot(page: Page, opts: CreateProductViaLotOptions): Promise<void> {
  await page.goto('/dashboard/purchases')
  await page.getByRole('button', { name: 'Registra Lotto' }).click()
  if (opts.sourceName) {
    await page.locator('#pc-source-name').fill(opts.sourceName)
  }
  const line = page.getByTestId('purchase-line').nth(0)
  await line.getByTestId('line-product').selectOption('__new__')
  await line.locator('input[placeholder="Titolo nuovo prodotto *"]').fill(opts.title)
  if (opts.price) {
    await line.locator('input[placeholder="Prezzo vendita (€)"]').fill(opts.price)
  }
  if (opts.category) {
    await line.locator('select').nth(1).selectOption({ label: opts.category })
  }
  if (opts.collection) {
    await line.locator('select').nth(2).selectOption({ label: opts.collection })
  }
  await line.getByTestId('line-quantity').fill(opts.quantity)
  await line.getByTestId('line-cost').fill(opts.cost ?? '20')
  await page.getByRole('button', { name: 'Registra e Carica in Inventario' }).click()
  await expect(page.getByText('Lotto registrato e inventario aggiornato con successo')).toBeVisible()
}
