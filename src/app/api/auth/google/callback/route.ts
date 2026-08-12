import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS, signToken } from '@/lib/dash-auth'
import { logAudit } from '@/lib/audit'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const STATE_COOKIE = 'dcc-oauth-state'
const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 600,
}

function isAllowedEmail(email: string): boolean {
  const raw = process.env.DASHBOARD_GOOGLE_EMAILS || ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const googleError = url.searchParams.get('error')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value

  const fail = (error: string) => {
    const res = NextResponse.redirect(`${SITE_URL}/dashboard?error=${error}`)
    res.cookies.set(STATE_COOKIE, '', { ...STATE_COOKIE_OPTIONS, maxAge: 0 })
    return res
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return fail('google-not-configured')
  if (googleError) return fail('google-denied')
  if (!code || !state || !expectedState || state !== expectedState) return fail('google-state')

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI || `${SITE_URL}/api/auth/google/callback`

  try {
    const oauth = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth.getToken(code)
    const idToken = tokens.id_token
    if (!idToken) return fail('google-token')

    const ticket = await oauth.verifyIdToken({ idToken, audience: clientId })
    const payload = ticket.getPayload()
    if (!payload || payload.email_verified !== true || !payload.email) return fail('google-email')

    if (!isAllowedEmail(payload.email)) return fail('google-not-allowed')

    logAudit('dashboard.login', { email: payload.email })
    const res = NextResponse.redirect(`${SITE_URL}/dashboard`)
    res.cookies.set(COOKIE_NAME, signToken(`google:${payload.email}`), SESSION_COOKIE_OPTIONS)
    res.cookies.set(STATE_COOKIE, '', { ...STATE_COOKIE_OPTIONS, maxAge: 0 })
    return res
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return fail('google-error')
  }
}
