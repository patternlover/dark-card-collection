import pg from 'pg'
import { slugify } from '../src/lib/slug'

const { DATABASE_URI } = process.env
if (!DATABASE_URI) {
  console.error('[backfill-google-schema] DATABASE_URI mancante nelle env.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URI })
const client = await pool.connect()

type Row = {
  id: number
  title: string
  language: string | null
  grade: string | null
  quantity: number | null
  price: string | null
  compare_at_price: string | null
  description: string | null
  images: { url: string }[] | null
  is_preorder: boolean | null
  status: string | null
  item_group_id: string | null
  availability: string | null
  updated_at: string | null
}

const { rows } = await client.query<Row>(
  `SELECT id, title, language, grade, quantity, price, compare_at_price,
          description, images, is_preorder, status, item_group_id, availability, updated_at
   FROM products ORDER BY updated_at ASC`,
)

console.log(`[backfill-google-schema] ${rows.length} prodotti caricati`)

// --- Backfill item_group_id ---
const groupBackfill: { id: number; slug: string }[] = []
for (const r of rows) {
  if (!r.item_group_id && r.title) {
    groupBackfill.push({ id: r.id, slug: slugify(r.title) })
  }
}
console.log(`[backfill-google-schema] item_group_id da backfillare: ${groupBackfill.length}`)

// --- Backfill availability ---
const availabilityBackfill: { id: number; availability: string }[] = []
for (const r of rows) {
  if (r.availability) continue
  const availability = r.is_preorder
    ? 'preorder'
    : r.status === 'sold' || r.quantity === null || r.quantity <= 0
      ? 'out_of_stock'
      : 'in_stock'
  availabilityBackfill.push({ id: r.id, availability })
}
console.log(`[backfill-google-schema] availability da backfillare: ${availabilityBackfill.length}`)

// --- Dedup: titolo+lingua+grade identici => somma quantity su un solo survivor ---
const groups = new Map<string, Row[]>()
for (const r of rows) {
  const key = `${r.title}|${r.language ?? ''}|${r.grade ?? ''}`
  const g = groups.get(key)
  if (g) g.push(r)
  else groups.set(key, [r])
}

const toDelete: number[] = []
const survivorUpdates: { id: number; quantity: number; images: { url: string }[] }[] = []
for (const [, g] of groups) {
  if (g.length < 2) continue
  const survivor = g.reduce((a, b) => {
    const qa = a.quantity ?? 0
    const qb = b.quantity ?? 0
    return qb > qa || (qb === qa && (b.updated_at ?? '') > (a.updated_at ?? '')) ? b : a
  })
  const total = g.reduce((sum, r) => sum + (r.quantity ?? 0), 0)
  const images = [
    ...new Map(
      (survivor.images ?? []).concat(...g.map((r) => r.images ?? []).reverse()).map((i) => [i.url, i]),
    ).values(),
  ]
  survivorUpdates.push({ id: survivor.id, quantity: total, images })
  for (const r of g) {
    if (r.id !== survivor.id) toDelete.push(r.id)
  }
  console.log(
    `[backfill-google-schema] dedup "${g[0].title}" (${g[0].language ?? ''}/${g[0].grade ?? ''}): ${g.length} righe -> 1, quantity=${total}, eliminati ${g.length - 1}`,
  )
}
console.log(`[backfill-google-schema] righe duplicate da eliminare: ${toDelete.length}`)

// --- Esegui in una transazione ---
const tx = client
try {
  await tx.query('BEGIN')
  for (const b of groupBackfill) {
    await tx.query(`UPDATE products SET item_group_id = $1 WHERE id = $2`, [b.slug, b.id])
  }
  for (const b of availabilityBackfill) {
    await tx.query(`UPDATE products SET availability = $1::enum_products_availability WHERE id = $2`, [
      b.availability,
      b.id,
    ])
  }
  for (const s of survivorUpdates) {
    await tx.query(
      `UPDATE products SET quantity = $1, images = $2::jsonb, updated_at = now() WHERE id = $3`,
      [s.quantity, JSON.stringify(s.images), s.id],
    )
  }
  for (const id of toDelete) {
    await tx.query(`DELETE FROM products WHERE id = $1`, [id])
  }
  await tx.query('COMMIT')
  console.log(
    `[backfill-google-schema] FATTO: ${groupBackfill.length} item_group_id, ${availabilityBackfill.length} availability, ${survivorUpdates.length} merge, ${toDelete.length} eliminazioni`,
  )
} catch (e) {
  await tx.query('ROLLBACK')
  console.error('[backfill-google-schema] ERRORE, rollback eseguito', e)
  process.exit(1)
} finally {
  tx.release()
  await pool.end()
}
