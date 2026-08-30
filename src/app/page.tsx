import { redirect } from 'next/navigation'

// P1-01 replaces this with the welcome screen and the onboarding flow. Until then, land on the
// first tab that has a real screen behind it.
export default function Home() {
  redirect('/jams')
}
