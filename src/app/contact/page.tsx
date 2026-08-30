import type { Metadata } from 'next'
import { InfoLink, InfoPage, InfoSection } from '@/components/riff/InfoPage'

export const metadata: Metadata = { title: 'Contact · Riff' }

/** Honest support page — a real address, real expectations, no dead-end form. Server component. */
export default function ContactPage() {
  return (
    <InfoPage title="Contact us" backHref="/me">
      <InfoSection>
        <p>
          Riff is a small preview run by a small team, so there&rsquo;s no ticket queue and no
          chatbot — just us reading email. The best way to reach us is to write, and the most useful
          thing you can include is what you were trying to do when things got in the way.
        </p>
        <p>
          Email{' '}
          <InfoLink href="mailto:hello@riff.app">hello@riff.app</InfoLink> and we&rsquo;ll get back
          to you. We usually reply within a couple of days; because this is a preview and the team
          is small, some things take a little longer — we&rsquo;ll always be straight with you about
          what&rsquo;s real and what&rsquo;s still pretend.
        </p>
      </InfoSection>

      <InfoSection title="Before you write">
        <p>
          A lot of the common questions — how requests work, how reliability is earned, what Riff
          Credits are — are answered on the <InfoLink href="/help">Help &amp; FAQ</InfoLink> page.
          Worth a look; it might save you the wait.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
