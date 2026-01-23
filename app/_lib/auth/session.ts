import { cookies } from 'next/headers'
import { Session, User } from './types'

const SESSION_COOKIE_NAME = 'rc_vv_session'

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: '/',
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value) as Session
  } catch {
    return null
  }
}

export async function getUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user ?? null
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  if (!session) return false

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    return false
  }

  return true
}

export function createSessionCookie(session: Session): { name: string; value: string; options: typeof cookieOptions } {
  return {
    name: SESSION_COOKIE_NAME,
    value: JSON.stringify(session),
    options: cookieOptions,
  }
}

export function deleteSessionCookie(): { name: string; value: string; options: typeof cookieOptions & { maxAge: number } } {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    options: { ...cookieOptions, maxAge: 0 },
  }
}
