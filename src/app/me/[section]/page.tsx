import Link from 'next/link'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Stub destinations for the profile's settings list. docs/BUILD-PLAN.md P5-01 says to stub
 * these; they exist so no row on the profile dead-ends.
 */
const SECTIONS: Record<string, { title: string; body: string }> = {
  edit: {
    title: 'Editing your player card',
    body: 'Name, instruments, genres and intent — the things you choose. Your reliability, repeats and vouches are earned and stay read-only.',
  },
  clip: {
    title: 'Replacing your clip',
    body: 'A 24-second recorder lives here. A short clip shows people how you actually sound.',
  },
  availability: {
    title: 'Editing your availability',
    body: 'The full seven-day, three-slot grid you can tap and drag to paint.',
  },
  bands: {
    title: 'Your bands',
    body: 'Every band you play in, and the open seats they are trying to fill.',
  },
  saved: { title: 'Saved musicians', body: 'People you have kept for later.' },
  settings: {
    title: 'Settings and privacy',
    body: 'Who can see you, how far you travel, and what your neighbourhood reveals. Riff never shows your address.',
  },
  safety: {
    title: 'Safety centre',
    body: 'Reporting, blocking, and what to do if a session goes wrong.',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return { title: `${SECTIONS[section]?.title ?? 'Profile'} · Riff` }
}

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }))
}

export default async function MeSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const content = SECTIONS[section] ?? {
    title: 'Not built yet',
    body: 'This part of your profile does not exist in v1.',
  }
  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title={content.title} backHref="/me" />}
      mainClassName="flex items-center px-4 py-6"
    >
      <EmptyState
        className="w-full"
        title="Not built yet"
        body={content.body}
        action={
          <Link href="/me" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Back to your profile
          </Link>
        }
      />
    </AppShell>
  )
}
