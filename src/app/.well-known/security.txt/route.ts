const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export async function GET() {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const content = `Contact: mailto:darkcardcollection@gmail.com
Expires: ${expires}
Preferred-Languages: it, en
Canonical: ${SITE_URL}/.well-known/security.txt
`
  return new Response(content, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
