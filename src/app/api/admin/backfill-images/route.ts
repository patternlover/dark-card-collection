import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { importProductImages, buildImagesField } from '@/lib/image-import'

function verifyAuth(request: Request): boolean {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  const valid = [process.env.CRON_SECRET, process.env.PAYLOAD_SECRET]
    .filter(Boolean) as string[]

  if (secret && valid.includes(secret)) return true

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (valid.includes(token)) return true
  }

  return false
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayloadClient()
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === '1'

    let total = 0
    let processed = 0
    let uploaded = 0
    let linked = 0
    const errors: string[] = []
    let page = 1
    const pageSize = 50

    while (true) {
      const result = await payload.find({
        collection: 'products',
        where: { imageUrl: { exists: true } },
        limit: pageSize,
        page,
        sort: 'id',
      })

      for (const doc of result.docs) {
        const product = doc as any
        total++
        if (!product.imageUrl) continue
        if ((product.images?.length || 0) > 0 && !force) {
          processed++
          continue
        }

        if (force && (product.images?.length || 0) > 0) {
          for (const entry of product.images) {
            const mediaId = typeof entry === 'object' && entry !== null ? (entry as any).image : entry
            if (!mediaId) continue
            try {
              await payload.delete({ collection: 'media', id: mediaId } as any)
            } catch (err) {
              errors.push(
                `${product.itemId}: Failed to delete old media ${mediaId}: ${
                  err instanceof Error ? err.message : String(err)
                }`,
              )
            }
          }
        }

        const imageResult = await importProductImages(
          payload,
          product.imageUrl,
          product.title || product.itemId || 'Product',
        )

        if (imageResult.mediaIds.length > 0) {
          await payload.update({
            collection: 'products',
            id: product.id,
            data: { images: buildImagesField(imageResult.mediaIds) },
          } as any)
          linked++
        }
        uploaded += imageResult.uploaded
        for (const err of imageResult.errors) {
          errors.push(`${product.itemId}: ${err}`)
        }
        processed++
      }

      if ((result.page ?? 0) >= (result.totalPages ?? 0)) break
      page++
    }

    return NextResponse.json({
      success: true,
      total,
      processed,
      uploaded,
      linked,
      errors: errors.slice(0, 20),
      errorCount: errors.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Backfill failed', details: String(error) },
      { status: 500 },
    )
  }
}
