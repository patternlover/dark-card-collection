import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { setDashSession } from '@/lib/dash-auth'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

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
  const expectedState = cookieStore.get('dcc-oauth-state')?.value
  cookieStore.delete('dcc-oauth-state')

  const fail = (code: string) => NextResponse.redirect(`${SITE_URL}/dashboard?error=${code}`)

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

    await setDashSession(`google:${payload.email}`)
    return NextResponse.redirect(`${SITE_URL}/dashboard`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return fail('google-error')
  }
}
