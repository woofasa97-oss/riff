import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Riff' }

// The product story starts at Welcome (docs/SPEC.md §4.1). There is no persisted auth in v1,
// so every cold entry gets the front door; "I already have an account" jumps straight to /jams.
export default function Home() {
  redirect('/welcome')
}
