import { redirect } from 'next/navigation'
// Canonical settings live under the profile.
export default function Settings() {
  redirect('/me/settings')
}
