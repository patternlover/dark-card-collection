/**
 * Collega le immagini caricate su Blob ai prodotti Medusa (thumbnail + gallery).
 *
 * Uso:
 *   npx medusa exec ./src/scripts/import-history/attach-images.ts            # dry-run
 *   COMMIT=1 npx medusa exec ./src/scripts/import-history/attach-images.ts   # scrive
 *   IMPORT_MANIFEST=.import/manifest.json  (default)
 *
 * Idempotente: aggiorna solo se thumbnail/gallery differiscono.
 */
import fs from "fs"
import path from "path"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from "@medusajs/framework/utils"

interface QueryLike {
  graph: (q: Record<string, unknown>) => Promise<{ data: unknown[] }>
}

interface ProductNode {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  images?: { url?: string }[]
}

export default async ({ container }: { container: MedusaContainer }) => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (m: string) => void
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryLike
  const productService = container.resolve(ModuleRegistrationName.PRODUCT) as unknown as {
    updateProducts: (selector: unknown, data: unknown) => Promise<unknown>
  }
  const commit = process.env.COMMIT === "1"
  const manifestPath = path.resolve(
    process.cwd(),
    process.env.IMPORT_MANIFEST ?? path.join(".import", "manifest.json"),
  )
  const log = (m: string) => {
    logger.info(m)
    console.log(m)
  }
  log(`[images] mode=${commit ? "COMMIT" : "DRY-RUN"} manifest=${manifestPath}`)

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Manifest non trovato: ${manifestPath} (lancialo con scripts/upload-product-images.ts --commit)`,
    )
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, string[]>
  const handles = Object.keys(manifest).sort()
  if (handles.length === 0) {
    log("[images] manifest vuoto, niente da fare")
    return
  }

  const productsRes = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail", "images.url"],
    filters: { handle: handles },
    pagination: { take: 1000 },
  })
  const byHandle = new Map(
    ((productsRes.data ?? []) as ProductNode[]).map((p) => [p.handle, p]),
  )

  let updated = 0
  for (const handle of handles) {
    const urls = manifest[handle].filter(Boolean)
    if (urls.length === 0) continue
    const product = byHandle.get(handle)
    if (!product) {
      log(`[warn] prodotto non trovato per handle: ${handle}`)
      continue
    }
    const currentGallery = (product.images ?? [])
      .map((i) => i.url ?? "")
      .filter(Boolean)
    const same =
      (product.thumbnail ?? "") === urls[0] &&
      currentGallery.length === urls.length &&
      currentGallery.every((u, i) => u === urls[i])
    if (same) {
      log(`[skip] ${product.title}: immagini già aggiornate`)
      continue
    }
    log(
      `[plan] ${product.title}: thumbnail=${urls[0]} gallery=${urls.length} ` +
        `(prima: ${product.thumbnail ?? "nessuna"})`,
    )
    if (!commit) continue
    // Forma (selector, data): l'oggetto singolo aggiorna solo alcuni campi.
    await productService.updateProducts(
      { id: product.id },
      {
        thumbnail: urls[0],
        images: urls.map((url) => ({ url })),
      },
    )
    updated++
    log(`[commit] ${product.title}: ${urls.length} immagini`)
  }

  if (!commit) log("[dry-run] NESSUNA scrittura. Rilancia con COMMIT=1.")
  else log(`[images] prodotti aggiornati: ${updated}`)
}
