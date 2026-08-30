import type { Metadata, Viewport } from 'next'
import { Geist, Lora } from 'next/font/google'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${lora.variable}`}>
      {/* max-w-md keeps the 375px column centred instead of stretching to desktop width. */}
      <body className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
