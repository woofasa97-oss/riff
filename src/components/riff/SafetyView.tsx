import { ShieldCheck } from 'lucide-react'
import { InfoLink, InfoPage, InfoSection } from '@/components/riff/InfoPage'

/**
 * Safety centre — a calm, honest content page reachable from the profile. Static prose only,
 * so it stays a server component. Covers Riff's safety stance, meeting someone new to play,
 * how to report or block (via email for now, since in-app tools aren't built), and what to do
 * if a session goes wrong. Tokens + lucide only, matching the About/Help/Contact pages.
 */
export function SafetyView() {
  return (
    <InfoPage title="Safety centre" backHref="/me">
      <InfoSection>
        <span className="mb-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </span>
        <p>
          Riff exists to get you playing with real people, and that only works if it feels safe to
          say yes. Here&rsquo;s how we protect that — what we share and what we never do, how to
          meet someone new sensibly, and what to do if a session goes wrong.
        </p>
      </InfoSection>

      <InfoSection title="What Riff shares — and what it never does">
        <p>
          The map and every profile show a{' '}
          <span className="font-semibold text-foreground">neighbourhood, never an address</span>.
          Your exact location is never on the map, and it never shows on a jam that hasn&rsquo;t
          been confirmed.
        </p>
        <p>
          Nothing about a session is shared until it&rsquo;s{' '}
          <span className="font-semibold text-foreground">confirmed</span> — someone accepted, and
          you&rsquo;re both going. Only then does the exact spot appear, and only to the people
          actually attending. A request on its own reveals nothing and holds nothing.
        </p>
      </InfoSection>

      <InfoSection title="Meeting someone new to play">
        <p>
          The first time you play with someone, treat it like meeting any new person. A few habits
          make it easy:
        </p>
        <p>
          <span className="font-semibold text-foreground">Meet somewhere public or known.</span> A
          rehearsal room, a music shop&rsquo;s practice space, a venue, a busy café — somewhere with
          other people around beats a first session at anyone&rsquo;s home.
        </p>
        <p>
          <span className="font-semibold text-foreground">Tell a friend.</span> Let someone know
          where you&rsquo;ll be and roughly when you&rsquo;ll be done. It costs nothing and it
          matters.
        </p>
        <p>
          <span className="font-semibold text-foreground">Trust your gut.</span> If something feels
          off — before or during — you never owe anyone a jam. Every request and invite has a way
          out: <span className="font-semibold text-foreground">Decline</span> politely, or{' '}
          <span className="font-semibold text-foreground">Suggest another time</span>. Using them is
          normal, and no one is told you hesitated.
        </p>
      </InfoSection>

      <InfoSection title="If a session goes wrong">
        <p>
          <span className="font-semibold text-foreground">Leaving is always OK.</span> If you feel
          unsafe or uncomfortable, you don&rsquo;t need a reason and you don&rsquo;t need to finish
          the songs. Go. Your reliability is never dinged for leaving a situation that felt wrong.
        </p>
        <p>
          Once you&rsquo;re somewhere safe, tell us what happened so we can act on it —{' '}
          <InfoLink href="mailto:safety@riff.app">safety@riff.app</InfoLink>. If anyone is in
          immediate danger, contact your local emergency services first.
        </p>
      </InfoSection>

      <InfoSection title="Reporting and blocking">
        <p>
          We want a fast in-app way to report a person, flag a session that went wrong, and block
          someone so they can&rsquo;t reach you again. Being straight with you: those buttons
          aren&rsquo;t built yet. So for now there&rsquo;s one path that a real person reads.
        </p>
        <p>
          Email <InfoLink href="mailto:safety@riff.app">safety@riff.app</InfoLink> with who or what
          the report is about — a username, a jam, and what happened. That&rsquo;s enough for us to
          look into it, step in between you and someone, and follow up. In-app reporting and
          blocking are coming; until they land, this address is the way, and we treat it seriously.
        </p>
      </InfoSection>

      <InfoSection title="Anything else">
        <p>
          For how the app works, the <InfoLink href="/help">Help &amp; FAQ</InfoLink> covers most
          questions. For anything that isn&rsquo;t urgent safety, <InfoLink href="/contact">contact
          us</InfoLink> — we read everything.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
