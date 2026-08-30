import type { Metadata } from 'next'
import { InfoPage, InfoSection } from '@/components/riff/InfoPage'

export const metadata: Metadata = { title: 'About · Riff' }

/** What Riff is beyond the tagline. Static copy — server component. */
export default function AboutPage() {
  return (
    <InfoPage title="About Riff" backHref="/me">
      <InfoSection>
        <p>
          <span className="font-semibold text-foreground">Find your people. Play tonight.</span>{' '}
          Riff helps musicians find someone nearby to play with now — not next month, not once
          they&rsquo;ve joined a band, tonight — and turns that into a real session you both showed
          up to.
        </p>
      </InfoSection>

      <InfoSection title="How it works">
        <p>
          It&rsquo;s one loop. You see who&rsquo;s around and open to playing, you send someone a
          request, and if they accept it becomes a confirmed session with a time and a place.
          Nothing is booked until the other person says yes — a request on its own never holds a
          slot.
        </p>
        <p>
          After you play, you each leave a short recap. That recap is where your reputation comes
          from: how reliably you show up, who you&rsquo;ve played with more than once, and the
          vouches from people who were actually there. You can&rsquo;t edit any of it — that&rsquo;s
          what makes it worth something.
        </p>
      </InfoSection>

      <InfoSection title="Four ways in">
        <p>
          <span className="font-semibold text-foreground">Map</span> shows musicians and open jams
          around you by neighbourhood — never a home address.
        </p>
        <p>
          <span className="font-semibold text-foreground">Live</span> is what&rsquo;s happening
          right now: people online, open calls, jams starting soon.
        </p>
        <p>
          <span className="font-semibold text-foreground">Battle of the Bands</span> is a friendly
          competition — bands enter a round, the community listens and votes, and the winners split
          the prize pool.
        </p>
        <p>
          <span className="font-semibold text-foreground">Venues</span> are the rooms that host it
          all, from a back-room open mic to a proper stage.
        </p>
      </InfoSection>

      <InfoSection title="An honest note">
        <p>
          Riff is an early preview built on mock data, so the people, jams and venues you see are
          illustrative — they&rsquo;re here to show how the whole thing feels once it&rsquo;s real.
        </p>
        <p>
          Riff Credits are play money. They have no cash value and exist only to make the
          competition feel alive. Nothing you do with them is a real transaction.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
