import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, fetchUserProfile } from '@/app/lib/auth/rc-oauth'
import { createSessionCookie } from '@/app/lib/auth/session'
import { Session } from '@/app/lib/auth/types'
import supabase from '@/app/actions/supabase'

const STATE_COOKIE_NAME = 'oauth_state'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_error', request.url))
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url))
  }

  // Validate state against cookie (CSRF protection)
  const cookieStore = await cookies()
  const storedState = cookieStore.get(STATE_COOKIE_NAME)?.value

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url))
  }

  // Clear the state cookie
  cookieStore.delete(STATE_COOKIE_NAME)

  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code)

    // Fetch user profile from RC API
    const profile = await fetchUserProfile(tokenResponse.access_token)

    // Upsert user in Supabase
    const { data: userData, error: dbError } = await supabase
      .from('Users')
      .upsert(
        {
          email: profile.email,
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          rc_id: profile.id,
          type: 'human',
        },
        { onConflict: 'rc_id' }
      )
      .select('id')
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(new URL('/?error=db_error', request.url))
    }

    // Create session
    const session: Session = {
      user: {
        id: userData.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        rcId: profile.id,
        imagePath: profile.image_path,
      },
      accessToken: tokenResponse.access_token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
    }

    // Set session cookie and redirect
    const sessionCookie = createSessionCookie(session)
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

    return NextResponse.redirect(new URL('/', request.url))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
