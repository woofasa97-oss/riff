import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/Button'
import { InfoLink, InfoPage, InfoQA, InfoSection } from '@/components/riff/InfoPage'

export const metadata: Metadata = { title: 'Help · Riff' }

/** Help centre / FAQ. Static copy — server component. */
export default function HelpPage() {
  return (
    <InfoPage title="Help & FAQ" backHref="/me">
      <InfoSection>
        <p>
          The short version of how Riff works, one question at a time. Still stuck after this?{' '}
          <InfoLink href="/contact">Contact us</InfoLink> — we read everything.
        </p>
      </InfoSection>

      <InfoQA q="How do I find people to play with?">
        <p>
          Open <span className="font-semibold text-foreground">Map</span> to see musicians and open
          jams near you, or <span className="font-semibold text-foreground">Live</span> for
          who&rsquo;s around right now. Tap someone whose instruments and vibe fit, and send a
          request.
        </p>
      </InfoQA>

      <InfoQA q="What does &ldquo;nothing is confirmed until they accept&rdquo; mean?">
        <p>
          A request is an ask, not a booking. The session only becomes real once the other person
          accepts — until then nothing is held and no time or place is locked in. If they decline or
          suggest another time, you&rsquo;re free to plan around it.
        </p>
      </InfoQA>

      <InfoQA q="How is my reliability calculated?">
        <p>
          It&rsquo;s earned from your session recaps — did you show up to the jams you confirmed?
          Riff computes it from those recaps and nothing else. It is never editable, by you or by
          us, which is exactly what makes it mean something.
        </p>
      </InfoQA>

      <InfoQA q="What are vouches?">
        <p>
          A vouch is one musician backing another for something specific — great time, easy to play
          with, brought the energy. Only people you&rsquo;ve actually played a confirmed session
          with can vouch for you, so a vouch always comes from someone who was in the room.
        </p>
      </InfoQA>

      <InfoQA q="What are Riff Credits and the competition?">
        <p>
          Riff Credits are play money — no cash value, nothing to buy or cash out. In Battle of the
          Bands, entering a round costs Credits, and every entry feeds the prize pool. The community
          votes, and the winning bands split that pool. It&rsquo;s a game, played with game money.
        </p>
      </InfoQA>

      <InfoQA q="How does guest mode work?">
        <p>
          As a guest you can look around freely — browse the map, live, jams and profiles. The
          moment you want to <span className="font-semibold text-foreground">do</span> something —
          send a request, join a jam, leave a recap — Riff asks you to make an account so the other
          person knows who they&rsquo;re playing with.
        </p>
      </InfoQA>

      <InfoQA q="I forgot my password.">
        <p>
          Head to <InfoLink href="/reset">password reset</InfoLink> and we&rsquo;ll walk you
          through it. Recovery works through the email you signed up with, so use that address. If
          you never added an email, there&rsquo;s no way back into that account —{' '}
          <InfoLink href="/contact">get in touch</InfoLink> and we&rsquo;ll help you start fresh.
        </p>
      </InfoQA>

      <InfoQA q="How do I delete my account or get more help?">
        <p>
          Anything not covered here — deleting your account, a session that went wrong, a bug — is a
          message away. <InfoLink href="/contact">Contact us</InfoLink> and we&rsquo;ll take it from
          there.
        </p>
      </InfoQA>

      <div className="border-t border-border-subtle pt-6">
        <p className="mb-4 text-[15px] leading-relaxed text-foreground-dim">
          Still stuck? We&rsquo;d rather hear from you than have you guess.
        </p>
        <Link href="/contact" className={buttonClass({ variant: 'primary', fullWidth: true })}>
          Contact us
        </Link>
      </div>
    </InfoPage>
  )
}
