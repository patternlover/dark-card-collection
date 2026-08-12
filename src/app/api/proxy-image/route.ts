import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'product-images.s3.cardmarket.com',
  'images.cardmarket.com',
  'cdn.cardmarket.com',
]

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Referer': 'https://www.cardmarket.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: response.status })
    }

    // redirect validation: il fetch segue i redirect; l'URL finale deve restare in allowlist
    let finalHost: string | null = null
    try {
      finalHost = new URL(response.url).hostname
    } catch {
      return NextResponse.json({ error: 'Invalid upstream URL' }, { status: 502 })
    }
    if (!ALLOWED_HOSTS.includes(finalHost)) {
      return NextResponse.json({ error: 'Redirect outside allowlist' }, { status: 403 })
    }

    // content-type deve essere un'immagine (mai text/html/svg non richiesto)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().startsWith('image/') || contentType.toLowerCase().includes('svg')) {
      return NextResponse.json({ error: 'Content-Type not allowed' }, { status: 400 })
    }

    // limite dimensione: preferisci content-length, poi fallback sul body letto
    const contentLength = Number(response.headers.get('content-length')) || 0
    if (contentLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    const body = await response.arrayBuffer()
    if (body.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 })
  }
}
