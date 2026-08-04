import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=google-not-configured`)
  }

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI || `${SITE_URL}/api/auth/google/callback`

  const state = crypto.randomBytes(24).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('dcc-oauth-state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
