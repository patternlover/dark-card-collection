import { test, expect, type Page } from '@playwright/test'

const DASH_COOKIE = process.env.DASH_COOKIE || ''

async function login(page: Page) {
  expect(DASH_COOKIE).toBeTruthy()
  await page.context().addCookies([
    { name: 'dcc-dash', value: DASH_COOKIE, url: 'https://darkcardcollection.com' },
  ])
}

test('PROD: scritture su categorie, collezioni, messaggi, prodotti — no 500', async ({ page }) => {
  await login(page)
  const failingWrites: string[] = []
  page.on('response', async (r) => {
    if (r.request().method() === 'POST' && r.url().includes('/dashboard') && r.status() >= 500) {
      failingWrites.push(`${r.status()} ${r.url().split('/').pop()}`)
    }
  })
  const stamp = Date.now()

  // categorie: crea + modifica + elimina
  const catName = `E2E Cat ${stamp}`
  await page.goto('/dashboard/categorie')
  await page.getByRole('button', { name: 'Nuova Categoria' }).click()
  await page.locator('#category-name').fill(catName)
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Categoria creata')).toBeVisible({ timeout: 25000 })
  await page.getByRole('button', { name: `Modifica ${catName}` }).click()
  await page.locator('#category-name').fill(`${catName} X`)
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Categoria aggiornata')).toBeVisible({ timeout: 25000 })
  page.on('dialog', (d) => d.accept())
  await page.getByRole('button', { name: `Elimina ${catName} X` }).click()
  await expect(page.getByText('Categoria eliminata')).toBeVisible({ timeout: 25000 })
  console.log('CATEGORIE_CRUD_OK')

  // collezioni: crea + elimina
  const colName = `E2E Col ${stamp}`
  await page.goto('/dashboard/collezioni')
  await page.getByRole('button', { name: 'Nuova Collezione' }).click()
  await page.locator('#collection-name').fill(colName)
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Collezione creata')).toBeVisible({ timeout: 25000 })
  await page.getByRole('button', { name: `Elimina ${colName}` }).click()
  await expect(page.getByText('Collezione eliminata')).toBeVisible({ timeout: 25000 })
  console.log('COLLEZIONI_CRUD_OK')

  // messaggi: espandi e segna letto (poi ripristina)
  await page.goto('/dashboard/messages')
  await page.waitForTimeout(2000)
  const subj = page.getByText(/@/).first()
  if ((await subj.count()) > 0) {
    await subj.click()
    await page.waitForTimeout(1200)
    const readBtn = page.getByRole('button', { name: 'Segna come letto' })
    if ((await readBtn.count()) > 0) {
      await readBtn.click()
      await expect(page.getByRole('button', { name: 'Segna come non letto' })).toBeVisible({ timeout: 25000 })
      await page.getByRole('button', { name: 'Segna come non letto' }).click()
      console.log('MESSAGGI_TOGGLE_OK')
    }
  }

  console.log('FAILING_WRITES', JSON.stringify(failingWrites.slice(0, 8)))
  expect(failingWrites, `Scritture fallite: ${JSON.stringify(failingWrites)}`).toEqual([])
})
