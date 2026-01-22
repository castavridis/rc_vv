import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'rc_vv_session'

// Routes that require authentication
const protectedRoutes = [] // Nothing at the moment, consider adding '/assess'

// Routes that should redirect to home if user is already authenticated
const authRoutes = ['/login']

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  const isAuthenticated = !!sessionCookie?.value

  const { pathname } = request.nextUrl

  // Check if the path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login'], // Suggested /dashboard/:path*
}
