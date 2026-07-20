import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { updateRowByItemId, productToSheetFields } from '@/lib/google-sheets'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const password = request.headers.get('x-sync-password')
  if (password !== process.env.SYNC_PASSWORD && password !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const allowed = [
    'title', 'slug', 'description', 'storePrice', 'price', 'compareAtPrice',
    'status', 'condition', 'category', 'collection', 'language', 'productState',
    'quantity', 'imageUrl', 'featured', 'cardNumber', 'rarity', 'itemId', 'isVisible',
  ]

  const data: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) {
      data[key] = body[key]
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    const updated = await payload.update({
      collection: 'products',
      id: Number(id),
      data,
      draft: false,
    } as any)

    let sheetSynced = false
    if (data.itemId) {
      const sheetFields = productToSheetFields(data)
      if (Object.keys(sheetFields).length > 0) {
        sheetSynced = await updateRowByItemId(data.itemId, sheetFields)
      }
    }

    return NextResponse.json({ product: updated, sheetSynced })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const password = request.headers.get('x-sync-password')
  if (password !== process.env.SYNC_PASSWORD && password !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayloadClient()
    await payload.delete({
      collection: 'products',
      id: Number(id),
    } as any)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
