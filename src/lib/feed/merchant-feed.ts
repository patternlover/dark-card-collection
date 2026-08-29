/**
 * Feed Google Merchant (XML, schema g:). Legge il catalogo Medusa tramite
 * l'adapter storefront. Riferimento:
 * https://support.google.com/merchants/answer/7052112
 */
import { listCatalogProducts, StorefrontProduct } from "@/lib/medusa/products"

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://darkcardcollection.com"
).replace(/\/+$/, "")

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function merchantAvailability(p: StorefrontProduct): string {
  if (p.availability === "preorder") return "preorder"
  return p.quantity > 0 ? "in_stock" : "out_of_stock"
}

function merchantCondition(p: StorefrontProduct): string {
  if (p.condition === "new" || p.condition === "refurbished") return p.condition
  return "used"
}

function itemXml(p: StorefrontProduct): string {
  const price = p.price > 0 ? `${p.price.toFixed(2)} EUR` : "0.00 EUR"
  const image = p.images?.[0]?.image?.url ?? p.image_link ?? ""
  const fields: string[] = [
    `<g:id>${xmlEscape(p.productId)}</g:id>`,
    `<g:item_group_id>${xmlEscape(p.item_group_id || p.productId)}</g:item_group_id>`,
    `<g:title>${xmlEscape(p.title)}</g:title>`,
    `<g:description>${xmlEscape(p.description || `${p.title} - Dark Card Collection`)}</g:description>`,
    `<g:link>${xmlEscape(`${SITE_URL}/products/${p.slug}`)}</g:link>`,
  ]
  if (image) fields.push(`<g:image_link>${xmlEscape(image)}</g:image_link>`)
  fields.push(`<g:availability>${merchantAvailability(p)}</g:availability>`)
  fields.push(`<g:price>${xmlEscape(price)}</g:price>`)
  if (p.sale_price && p.sale_price > p.price) {
    fields.push(`<g:sale_price>${xmlEscape(`${p.sale_price.toFixed(2)} EUR`)}</g:sale_price>`)
  }
  fields.push(`<g:condition>${merchantCondition(p)}</g:condition>`)
  fields.push(`<g:product_type>${xmlEscape(p.item_category_1 || "product")}</g:product_type>`)
  if (p.google_product_category) {
    fields.push(`<g:google_product_category>${xmlEscape(p.google_product_category)}</g:google_product_category>`)
  }
  if (p.set_name) {
    fields.push(`<g:custom_label_0>${xmlEscape(p.set_name)}</g:custom_label_0>`)
  }
  if (p.cost_of_goods_sold !== undefined) {
    fields.push(
      `<g:cost_of_goods_sold>${xmlEscape(`${p.cost_of_goods_sold.toFixed(2)} EUR`)}</g:cost_of_goods_sold>`,
    )
  }
  fields.push(`<g:identifier_exists>no</g:identifier_exists>`)
  return `<item>\n${fields.map((f) => `  ${f}`).join("\n")}\n</item>`
}

export async function buildMerchantFeedXml(): Promise<string> {
  const products = await listCatalogProducts({ limit: 2000 })
  const items = products.map(itemXml)
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `  <channel>`,
    `    <title>Dark Card Collection</title>`,
    `    <link>${xmlEscape(SITE_URL)}</link>`,
    `    <description>Prodotti Pokémon TCG sigillati</description>`,
    ...items,
    `  </channel>`,
    `</rss>`,
    "",
  ].join("\n")
}