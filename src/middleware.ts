import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC = ['/welcome', '/login', '/signup']

/**
 * Edge gate: app screens need a session cookie; the front door needs the absence of one to
 * make sense. Only presence is checked here — the cookie is actually verified against the
 * sessions table by every API route and the app layout.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }
  const hasSession = Boolean(req.cookies.get('riff_session')?.value)
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (!hasSession && !isPublic && pathname !== '/') {
    return NextResponse.redirect(new URL('/welcome', req.url))
  }
  if (hasSession && (isPublic || pathname === '/')) {
    return NextResponse.redirect(new URL('/jams', req.url))
  }
  if (!hasSession && pathname === '/') {
    return NextResponse.redirect(new URL('/welcome', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
