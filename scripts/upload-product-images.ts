/**
 * Upload immagini prodotto su Vercel Blob + manifest per Medusa.
 *
 * Convenzione (tutto in ./images, gitignored):
 *   - file nominato come lo slug prodotto → cover:  <slug>.webp
 *   - più foto stesso prodotto → <slug>.webp, <slug>-2.webp, ...
 *   - nomi diversi dallo slug → mappatura in images/mapping.json:
 *       { "mia-foto.webp": "fascio-di-busti-ascesa-eroica" }
 *   - formati: webp/jpg/png ≤ 4MB consigliati.
 *
 * Uso:
 *   pnpm dlx tsx scripts/upload-product-images.ts [--dir images] [--force] [--commit]
 *   default = dry-run (stampa cosa farebbe). --commit carica davvero e scrive
 *   il manifest in apps/backend/.import/manifest.json (per attach-images.ts).
 *
 * Idempotente: salta i pathname già presenti (salvo --force).
 */
import fs from "node:fs"
import path from "node:path"

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png"])
const WARN_BYTES = 4 * 1024 * 1024

interface Args {
  dir: string
  manifest: string
  force: boolean
  commit: boolean
}

function parseArgs(): Args {
  const a = process.argv.slice(2)
  const get = (flag: string, fallback: string): string => {
    const i = a.indexOf(flag)
    return i >= 0 && a[i + 1] ? a[i + 1] : fallback
  }
  return {
    dir: get("--dir", "images"),
    manifest: get("--manifest", path.join("apps", "backend", ".import", "manifest.json")),
    force: a.includes("--force"),
    commit: a.includes("--commit"),
  }
}

function loadToken(): string {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    const line = fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("BLOB_READ_WRITE_TOKEN="))
    if (line) {
      return line.split("=").slice(1).join("=").replace(/^"|"$/g, "")
    }
  }
  throw new Error("BLOB_READ_WRITE_TOKEN mancante (env o .env.local)")
}

function contentType(ext: string): string {
  if (ext === ".webp") return "image/webp"
  if (ext === ".png") return "image/png"
  return "image/jpeg"
}

async function main() {
  const args = parseArgs()
  const dir = path.resolve(process.cwd(), args.dir)
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && IMAGE_EXT.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort()
  if (entries.length === 0) {
    console.log(`[upload] nessun file immagine in ${args.dir}`)
    return
  }

  let mapping: Record<string, string> = {}
  const mapPath = path.join(dir, "mapping.json")
  if (fs.existsSync(mapPath)) {
    mapping = JSON.parse(fs.readFileSync(mapPath, "utf8")) as Record<string, string>
    console.log(`[upload] mapping.json: ${Object.keys(mapping).length} voci`)
  }

  // Raggruppa per slug (mapping o basename); cover = primo in ordine alfabetico.
  const groups = new Map<string, string[]>()
  for (const file of entries) {
    const base = path.basename(file, path.extname(file))
    const slug = mapping[file] ?? base
    const arr = groups.get(slug) ?? []
    arr.push(file)
    groups.set(slug, arr)
  }

  const token = args.commit ? loadToken() : "dry-run"
  process.env.BLOB_READ_WRITE_TOKEN = token
  const { list, put } = await import("@vercel/blob")

  const existing = new Set<string>()
  const existingUrl = new Map<string, string>()
  if (args.commit) {
    let cursor: string | undefined
    do {
      const page = await list({ prefix: "products/", limit: 1000, cursor })
      for (const b of page.blobs) {
        existing.add(b.pathname)
        existingUrl.set(b.pathname, b.url)
      }
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)
    console.log(`[upload] blob esistenti sotto products/: ${existing.size}`)
  }

  const manifest: Record<string, string[]> = {}
  for (const [slug, files] of [...groups.entries()].sort()) {
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = path.extname(file).toLowerCase()
      const pathname = i === 0 ? `products/${slug}${ext}` : `products/${slug}-${i + 1}${ext}`
      const size = fs.statSync(path.join(dir, file)).size
      const sizeKb = `${(size / 1024).toFixed(0)}KB${size > WARN_BYTES ? " (pesante!)" : ""}`
      if (!args.commit) {
        console.log(`[dry-run] ${file} → ${pathname} (${sizeKb})`)
        continue
      }
      if (existing.has(pathname) && !args.force) {
        console.log(`[skip] ${pathname} già presente`)
        const known = existingUrl.get(pathname)
        if (known) urls.push(known)
        continue
      }
      const blob = await put(pathname, fs.readFileSync(path.join(dir, file)), {
        access: "public",
        contentType: contentType(ext),
        addRandomSuffix: false,
        allowOverwrite: true,
      })
      console.log(`[upload] ${file} → ${blob.url}`)
      urls.push(blob.url)
    }
    if (urls.length > 0) manifest[slug] = urls
  }

  if (!args.commit) {
    console.log(`[dry-run] ${entries.length} file, ${groups.size} prodotti. Rilancia con --commit.`)
    return
  }

  fs.mkdirSync(path.dirname(args.manifest), { recursive: true })
  fs.writeFileSync(args.manifest, JSON.stringify(manifest, null, 2))
  console.log(`[upload] manifest: ${args.manifest} (${Object.keys(manifest).length} prodotti)`)
}

void main()
