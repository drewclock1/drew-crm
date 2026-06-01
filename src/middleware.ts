import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware — cookie-only session check.
 * No Supabase client, no HTTP calls, no CORS issues.
 * All auth happens server-side via /api/auth/* routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/sb/') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next()
  }

  // Check for our session cookie (set by /api/auth/signin)
  const hasSession = request.cookies.has('crm-access-token')

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
