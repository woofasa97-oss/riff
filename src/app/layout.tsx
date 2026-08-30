import type { Metadata, Viewport } from 'next'
import { Geist, Lora } from 'next/font/google'
import { RiffProvider } from '@/lib/store'
import { SessionReset } from '@/components/riff/SessionReset'
import { viewerFromCookies } from '@/server/auth'
import { buildSnapshot } from '@/server/world'
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
  const viewerId = await viewerFromCookies()
  let snapshot: WorldSnapshot | null = null
  let staleCookie = false
  if (viewerId) {
    try {
      snapshot = buildSnapshot(viewerId)
    } catch {
      staleCookie = true
    }
  }
  return (
    <html lang="en" className={`${geist.variable} ${lora.variable}`}>
      {/* max-w-md keeps the 375px column centred instead of stretching to desktop width. */}
      <body className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background text-foreground antialiased">
        {staleCookie ? (
          <SessionReset />
        ) : snapshot ? (
          <RiffProvider snapshot={snapshot}>{children}</RiffProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
