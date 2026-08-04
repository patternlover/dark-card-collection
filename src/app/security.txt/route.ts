import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.redirect(new URL('/.well-known/security.txt', process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'), 308)
}
