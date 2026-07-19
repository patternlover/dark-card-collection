import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

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
    'status', 'condition', 'category', 'collection', 'language',
    'quantity', 'imageUrl', 'featured', 'cardNumber', 'rarity', 'itemId',
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
    return NextResponse.json({ product: updated })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
