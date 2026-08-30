import type { Metadata } from 'next'
import { LoginView } from '@/components/riff/LoginView'

export const metadata: Metadata = { title: 'Sign in · Riff' }

export default function LoginPage() {
  return <LoginView />
}
