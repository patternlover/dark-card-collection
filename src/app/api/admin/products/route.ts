import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-sync-password')
  if (password !== process.env.SYNC_PASSWORD && password !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const search = sp.get('search') || ''
  const status = sp.get('status') || ''
  const category = sp.get('category') || ''
  const collection = sp.get('collection') || ''
  const withImage = sp.get('withImage') || ''
  const page = parseInt(sp.get('page') || '1')
  const limit = parseInt(sp.get('limit') || '50')

  try {
    const payload = await getPayloadClient()

    const where: any[] = []

    if (search) {
      where.push({
        or: [
          { title: { contains: search } },
          { itemId: { contains: search } },
        ],
      })
    }
    if (status) {
      where.push({ status: { equals: status } })
    }
    if (category) {
      where.push({ category: { equals: parseInt(category) } })
    }
    if (collection) {
      where.push({ collection: { equals: parseInt(collection) } })
    }
    if (withImage === 'yes') {
      where.push({ imageUrl: { exists: true } })
    }
    if (withImage === 'no') {
      where.push({ imageUrl: { exists: false } })
    }

    const whereClause = where.length > 0 ? ({ and: where } as any) : undefined

    const [products, categories, collections, countResult] = await Promise.all([
      payload.find({
        collection: 'products',
        where: whereClause,
        limit,
        page,
        sort: '-created_at',
      }),
      payload.find({ collection: 'categories', limit: 100 }),
      payload.find({ collection: 'collections', limit: 100 }),
      payload.count({ collection: 'products', where: whereClause }),
    ])

    return NextResponse.json({
      products: products.docs,
      total: countResult.totalDocs,
      page,
      totalPages: Math.ceil(countResult.totalDocs / limit),
      categories: categories.docs,
      collections: collections.docs,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
