import { NextResponse, type NextRequest } from 'next/server'

/** Screens that only make sense signed OUT — a logged-in user is bounced to the app. */
const PUBLIC = ['/welcome', '/login', '/signup']

/**
 * Guests may roam. The app is browsable without an account (Discover, Map, the competition,
 * profiles, bands, venues, live); the client gates every ACTION behind sign-up, and the server
 * refuses any mutation without a session. So the edge only handles framing, not protection:
 *
 *  - No session hitting a public page or `/` → send them to the front door (`/welcome`).
 *  - No session hitting onboarding → that only happens post-signup, so send to `/signup`.
 *  - Everything else with no session → allowed through as a guest.
 *  - A logged-in user on a public page or `/` → into the app (`/jams`).
 *
 * Real protection lives in the API routes and the layout, which verify the cookie against the
 * sessions table; a mere cookie presence never grants access to private data.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }
  const hasSession = Boolean(req.cookies.get('riff_session')?.value)
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (hasSession) {
    if (isPublic || pathname === '/') return NextResponse.redirect(new URL('/jams', req.url))
    return NextResponse.next()
  }

  // --- guest (no session) ---
  if (pathname === '/') return NextResponse.redirect(new URL('/welcome', req.url))
  if (pathname.startsWith('/onboarding')) return NextResponse.redirect(new URL('/signup', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
