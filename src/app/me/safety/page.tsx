import type { Metadata } from 'next'
import { SafetyView } from '@/components/riff/SafetyView'

export const metadata: Metadata = { title: 'Safety centre · Riff' }

/**
 * Static /me/safety route — takes precedence over the /me/[section] stub. Renders the Safety
 * centre. Server component: SafetyView is static prose with no state or handlers.
 */
export default function SafetyPage() {
  return <SafetyView />
}
