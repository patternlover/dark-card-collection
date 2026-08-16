/**
 * Upload immagini prodotti su Vercel Blob e aggancio ai prodotti per slug.
 *
 * Legge la cartella `images/` (repo) con file nominati `<slug>.webp`, trova il
 * prodotto per slug, carica il file su Vercel Blob e aggiorna `products.images[]`
 * (array media) aggiungendo/creando il doc Media via Payload.
 *
 * Uso: pnpm exec tsx scripts/upload-images-to-blob.ts [--dry-run]
 * Richiede: BLOB_READ_WRITE_TOKEN + DATABASE_URI + PAYLOAD_SECRET (env locali).
 */
import fs from 'fs'
import path from 'path'
import { put } from '@vercel/blob'
import { getPayloadClient } from '../src/lib/payload'

const IMAGES_DIR = path.resolve(process.cwd(), 'images')

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    console.error('Manca BLOB_READ_WRITE_TOKEN: upload su Vercel Blob non possibile')
    process.exit(1)
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Cartella immagini non trovata: ${IMAGES_DIR}`)
    process.exit(1)
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))

  if (files.length === 0) {
    console.log('Nessuna immagine nella cartella images/')
    process.exit(0)
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}${files.length} immagini trovate in ${IMAGES_DIR}`)

  const payload = await getPayloadClient()

  let done = 0
  for (const file of files) {
    const slug = path.basename(file, path.extname(file)).toLowerCase()
    const product = await payload.find({
      overrideAccess: true,
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    if (product.docs.length === 0) {
      console.log(`  [skip] nessun prodotto con slug "${slug}" (${file})`)
      continue
    }

    const pid = product.docs[0].id
    const title = (product.docs[0] as { title?: string }).title || slug

    if (dryRun) {
      console.log(`  [would upload] ${file} -> prodotto ${pid} · ${title}`)
      done += 1
      continue
    }

    const filePath = path.join(IMAGES_DIR, file)
    const fileBuffer = fs.readFileSync(filePath)
    const blob = await put(`products/${slug}${path.extname(file)}`, fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    // crea/aggiorna il doc Media Payload (storage Vercel Blob via plugin)
    const media = await payload.create({
      overrideAccess: true,
      collection: 'media',
      data: {
        alt: title,
        url: blob.url,
        filename: `${slug}${path.extname(file)}`,
        mimeType: `image/${path.extname(file).replace('.', '')}`,
        filesize: fileBuffer.length,
      } as any,
    })

    await payload.update({
      overrideAccess: true,
      collection: 'products',
      id: pid,
      data: { images: [{ image: media.id }] } as any,
    })

    console.log(`  [ok] ${file} -> prodotto ${pid} · ${title} · media ${media.id} · ${blob.url}`)
    done += 1
  }

  console.log(dryRun ? `DRY RUN: ${done} immagini da caricare` : `Fatto: ${done} immagini caricate`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
