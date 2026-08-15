/**
 * Riconciliazione stock: allinea products.quantity al residuo reale delle righe
 * d'acquisto (Σ remaining_quantity per prodotto, con fallback quantity per le
 * righe legacy senza remaining_quantity).
 *
 * Uso: pnpm exec tsx scripts/reconcile-stock.ts [--dry-run]
 *
 * Corregge la divergenza "stock 0 ma residuo N nello storico acquisti" causata
 * da righe legacy con remaining_quantity NULL (non consumabili dal FIFO) o da
 * vendite che hanno scalato lo stock senza consumare le righe.
 */
import { getPayloadClient } from '../src/lib/payload'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const payload = await getPayloadClient()

  const totals = new Map<number, { title: string; remaining: number }>()
  let page = 1
  const pageSize = 100

  for (;;) {
    const res = await payload.find({
      overrideAccess: true,
      collection: 'purchases',
      page,
      limit: pageSize,
      depth: 0,
    })
    for (const doc of res.docs as any[]) {
      for (const line of doc.lines ?? []) {
        const product = typeof line.product === 'object' ? line.product : { id: line.product }
        const pid = Number(product?.id ?? line.product)
        if (!Number.isFinite(pid) || pid <= 0) continue
        const quantity = Number(line.quantity ?? 0)
        const remaining = Number(line.remaining_quantity ?? line.quantity ?? 0)
        const prev = totals.get(pid) ?? { title: '', remaining: 0 }
        totals.set(pid, {
          title: product?.title ?? prev.title,
          remaining: prev.remaining + Math.max(0, remaining || quantity || 0),
        })
      }
    }
    if (page >= res.totalPages) break
    page += 1
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}${totals.size} prodotti con righe d'acquisto`)

  let changed = 0
  for (const [pid, { title, remaining }] of totals) {
    const product = await payload.findByID({
      overrideAccess: true,
      collection: 'products',
      id: pid,
      depth: 0,
    })
    const current = Number((product as { quantity?: number }).quantity ?? 0)
    if (current === remaining) continue

    changed += 1
    const line = `${pid} · ${title || '?'}: stock ${current} → ${remaining}`
    console.log(dryRun ? `  [would fix] ${line}` : `  [fix] ${line}`)

    if (!dryRun) {
      await payload.update({
        overrideAccess: true,
        collection: 'products',
        id: pid,
        data: { quantity: remaining },
      })
    }
  }

  console.log(dryRun ? `DRY RUN: ${changed} prodotti da riconciliare` : `Fatto: ${changed} prodotti riconciliati`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
