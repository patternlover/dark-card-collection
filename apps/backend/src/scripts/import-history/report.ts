/**
 * Report puro (senza DB) dell'import storico: parsing + validazioni + piano.
 * Uso:  tsx src/scripts/import-history/report.ts [.import]
 */
import fs from "fs"
import path from "path"
import { groupProducts, parsePurchases, parseSales } from "./parse"

const dir = path.resolve(process.cwd(), process.argv[2] ?? ".import")
const purchases = parsePurchases(fs.readFileSync(path.join(dir, "purchases.csv"), "utf8"))
const sales = parseSales(fs.readFileSync(path.join(dir, "sales.csv"), "utf8"), purchases.rows)

console.log("=== ERRORI ===")
for (const e of [...purchases.errors, ...sales.errors]) console.log(`  [ERR] ${e}`)
console.log("=== WARNING ===")
for (const w of [...purchases.warnings, ...sales.warnings]) console.log(`  [WARN] ${w}`)
console.log("=== SKIPPED (vendite senza prezzo) ===")
for (const s of sales.skipped) console.log(`  [SKIP] ${s}`)

console.log(`\n=== PRODOTTI (${groupProducts(purchases.rows).length}) ===`)
for (const g of groupProducts(purchases.rows)) {
  console.log(
    `- ${g.name} [${g.categoryName}/${g.productType}/${g.language}/${g.condition}] ` +
      `set={${g.sets.join(" + ")}} qty=${g.totalQty} lotti=[${g.purchase_ids.join(",")}]`,
  )
}
console.log(`\n=== ORDINI (${sales.orders.length}) ===`)
for (const o of sales.orders) {
  const units = o.units.map((u) => `${u.purchase_id}#${u.unit_index}@${u.unit_price.toFixed(2)}`).join(" ")
  console.log(`- ${o.sale_id} ${o.sale_date.slice(0, 10)} ${o.platform}: ${units}`)
}
const purchasedUnits = purchases.rows.reduce((a, p) => a + p.quantity, 0)
const soldUnits = sales.orders.reduce((a, o) => a + o.units.length, 0)
const cost = purchases.rows.reduce((a, p) => a + p.quantity * p.unit_cost + p.extra_costs, 0)
const revenue = sales.orders.reduce((a, o) => a + o.units.reduce((x, u) => x + u.unit_price, 0), 0)
console.log(
  `\n=== TOTALI === lotti=${purchases.rows.length} acquistati=${purchasedUnits} ` +
    `venduti=${soldUnits} residui=${purchasedUnits - soldUnits} ` +
    `costo=€${cost.toFixed(2)} ricavi=€${revenue.toFixed(2)}`,
)
if (purchases.errors.length + sales.errors.length > 0) process.exit(1)
