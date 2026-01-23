import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { buildAuthorizationUrl } from '@/app/_lib/auth/rc-oauth'

const STATE_COOKIE_NAME = 'oauth_state'
const STATE_MAX_AGE = 60 * 10 // 10 minutes

export async function GET() {
  const state = crypto.randomUUID() // Crypto Web API

  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE,
    path: '/',
  })

  const authUrl = buildAuthorizationUrl(state)
  return NextResponse.redirect(authUrl)
}
