import { NextResponse } from 'next/server'
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS, signToken } from '@/lib/dash-auth'

export async function GET(request: Request) {
  const enabled = process.env.NODE_ENV === 'development' && process.env.DASH_DEV_LOGIN === '1'
  if (!enabled) {
    return new NextResponse('Not found', { status: 404 })
  }
  const res = NextResponse.redirect(new URL('/dashboard', request.url))
  res.cookies.set(COOKIE_NAME, signToken('google:dev@localhost'), SESSION_COOKIE_OPTIONS)
  return res
}
