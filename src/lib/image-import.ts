import type { Payload } from 'payload'

/**
 * Shared utility for importing product images from URLs into Payload CMS.
 *
 * Flow:
 * 1. Parse image_url column from Google Sheets (comma-separated URLs)
 * 2. Download each image via fetch()
 * 3. Upload to Payload media collection (which stores in Vercel Blob)
 * 4. Return array of media IDs to link to the product
 *
 * Usage in import scripts:
 *   const imageIds = await importProductImages(payload, row['image_url'], productTitle)
 *   // Then set productData.images = buildImagesField(imageIds)
 */

export interface ImageImportResult {
  mediaIds: (string | number)[]
  uploaded: number
  errors: string[]
}

/**
 * Parse image URLs from a CSV cell (comma-separated).
 * Handles spaces around commas and trims whitespace.
 */
export function parseImageUrls(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) return []
  return raw
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.startsWith('http'))
}

/**
 * Download an image from a URL and return it as a Buffer + metadata.
 */
async function downloadImage(url: string): Promise<{
  buffer: Buffer
  filename: string
  mimetype: string
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'Referer': 'https://www.cardmarket.com/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Determine filename from URL
  const urlPath = new URL(url).pathname
  const parts = urlPath.split('/')
  let filename = parts[parts.length - 1] || 'image.jpg'
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (!filename.includes('.')) {
    const ext = contentType.includes('png') ? '.png' : '.jpg'
    filename = `${filename}${ext}`
  }

  return { buffer, filename, mimetype: contentType }
}

/**
 * Import multiple images for a product.
 * Parses URLs from the image_url CSV column, downloads and uploads each.
 *
 * @param payload - Payload CMS instance
 * @param imageUrlRaw - Raw string from Google Sheets (comma-separated URLs)
 * @param productTitle - Product title for alt text
 * @param currentImageCount - Current number of images on the product (to avoid re-uploading)
 * @returns ImageImportResult with media IDs, count uploaded, and any errors
 */
export async function importProductImages(
  payload: Payload,
  imageUrlRaw: string | undefined,
  productTitle: string,
  currentImageCount: number = 0,
): Promise<ImageImportResult> {
  const result: ImageImportResult = {
    mediaIds: [],
    uploaded: 0,
    errors: [],
  }

  const urls = parseImageUrls(imageUrlRaw)
  if (urls.length === 0) return result

  // If product already has enough images, skip
  if (currentImageCount >= urls.length) {
    return result
  }

  // Only upload images that are missing
  const urlsToUpload = urls.slice(currentImageCount)

  for (const url of urlsToUpload) {
    try {
      const { buffer, filename, mimetype } = await downloadImage(url)

      const media = await payload.create({
        collection: 'media',
        data: {
          alt: productTitle,
        },
        file: {
          data: buffer,
          mimetype,
          name: filename,
          size: buffer.length,
        },
      })

      result.mediaIds.push(media.id)
      result.uploaded++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Image ${url}: ${msg}`)
      console.error(`Failed to import image: ${msg}`)
    }
  }

  return result
}

/**
 * Build the images array for a Payload product update/create.
 * Returns array of { image: mediaId } objects or undefined if no IDs.
 */
export function buildImagesField(
  mediaIds: (string | number)[],
): { image: string | number }[] | undefined {
  if (mediaIds.length === 0) return undefined
  return mediaIds.map((id) => ({ image: id }))
}
