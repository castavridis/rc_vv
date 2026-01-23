import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { deleteSessionCookie } from '@/app/_lib/auth/session'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const sessionCookie = deleteSessionCookie()
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  )

  return NextResponse.redirect(new URL('/', request.url))
}
