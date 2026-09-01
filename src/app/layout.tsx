import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { Geist, Lora } from 'next/font/google'
import { RiffProvider } from '@/lib/store'
import { SessionReset } from '@/components/riff/SessionReset'
import { SESSION_COOKIE, viewerFromCookies } from '@/server/auth'
import { buildSnapshot, buildGuestSnapshot } from '@/server/world'
import type { WorldSnapshot } from '@/lib/snapshot'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Riff',
  description: 'Find your people. Play tonight.',
}

// The design viewport is 375×812. Lock the zoom behaviour the prototype assumed.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f7fa',
}

/**
 * The layout is where a request becomes a viewer: the session cookie is verified, the world
 * snapshot is built server-side (same process as the database — no fetch), and the store
 * provider is created per request so no user's world can leak into another's render.
 * Signed-out requests render bare — middleware only lets them reach /welcome, /login, /signup.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const hasSessionCookie = Boolean(jar.get(SESSION_COOKIE)?.value)
  const viewerId = await viewerFromCookies()
  let snapshot: WorldSnapshot | null = null
  let staleCookie = false
  let dbUnavailable = false
  if (viewerId) {
    try {
      snapshot = buildSnapshot(viewerId)
    } catch {
      // Valid cookie, but the musician is gone (DB reset) — sign out and start clean.
      staleCookie = true
    }
  } else if (hasSessionCookie) {
    // A cookie is present but resolves to no live session — expired, the DB was reset, or a
    // "log out everywhere" password reset revoked it. Without this, the layout would silently
    // drop the user into guest mode while middleware keeps bouncing them off /login, /welcome
    // and /signup — a lockout with no way back in. Clear the cookie and return to the door.
    staleCookie = true
  } else {
    // No account: the public world. Guests browse; every action prompts sign-up. Guarded so a
    // database failure degrades to a calm message instead of throwing an unstyled white screen
    // at every first-time visitor.
    try {
      snapshot = buildGuestSnapshot()
    } catch {
      dbUnavailable = true
    }
  }
  return (
    <html lang="en" className={`${geist.variable} ${lora.variable}`}>
      {/* Mobile: a centred 375px column. Desktop (lg+): a wider centred app frame — AppShell turns
          into a sidebar + content pane inside it, so the app uses the screen instead of stranding a
          phone strip. The body stays a flex-COLUMN so pre-auth screens (welcome/login) are unchanged. */}
      <body className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background text-foreground antialiased lg:max-w-[1040px] lg:border-x lg:border-border-subtle lg:shadow-2xl">
        {staleCookie ? (
          <SessionReset />
        ) : snapshot ? (
          <RiffProvider snapshot={snapshot}>{children}</RiffProvider>
        ) : dbUnavailable ? (
          <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <h1 className="font-serif text-[22px] font-bold text-foreground">Riff is catching its breath</h1>
            <p className="mt-2 max-w-[280px] text-[14px] text-foreground-dim">
              We couldn’t reach the database just now. Give it a moment and reload.
            </p>
            {/* A hard reload (not client nav) so the server re-attempts opening the DB. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="mt-6 rounded-[12px] bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground"
            >
              Try again
            </a>
          </main>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
