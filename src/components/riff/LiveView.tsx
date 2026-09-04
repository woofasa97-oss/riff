'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { SendHorizontal, Share2, Star, X, Zap } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { DemoTagDark } from '@/components/ui/DemoTag'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useRiffStore } from '@/lib/store'
import { getBand, getLiveSession, getMusician, getMusicianByHandle, getVenue } from '@/mocks'

/** Star input for the end-of-session rating. */
function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-2" role="radiogroup" aria-label="Session rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className="transition-transform active:scale-90"
        >
          <Star
            size={28}
            className={n <= value ? 'text-[#facc15]' : 'text-muted'}
            fill={n <= value ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}

export function LiveView({ sessionId }: { sessionId: string }) {
  const [draft, setDraft] = useState('')
  const [rateOpen, setRateOpen] = useState(false)
  const [stars, setStars] = useState(0)
  const [copied, setCopied] = useState(false)
  const chatBySession = useRiffStore((s) => s.liveChat)
  const sendLiveComment = useRiffStore((s) => s.sendLiveComment)
  const rateSession = useRiffStore((s) => s.rateSession)
  const ratings = useRiffStore((s) => s.sessionRatings)
  const followed = useRiffStore((s) => s.followedBandIds)
  const toggleFollow = useRiffStore((s) => s.toggleFollowBand)

  const chatRef = useRef<HTMLDivElement>(null)
  const session = getLiveSession(sessionId)
  const band = session?.bandId ? getBand(session.bandId) : undefined
  const venue = session ? getVenue(session.venueId) : undefined
  const chat = useMemo(
    () => (session ? (chatBySession[session.id] ?? session.chat) : []),
    [session, chatBySession],
  )

  // A chat rail belongs at the newest line, not the oldest.
  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat])

  // The "Link copied" pill is transient — clear it a couple of seconds after it shows.
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  // Sharing needs no account, so it is never gated. Prefer the native share sheet; fall back to
  // copying the link. A cancelled share sheet rejects — swallow it, it is not an error.
  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url })
        return
      } catch (err) {
        // The user cancelling the sheet is not a failure — leave quietly.
        if (err instanceof Error && err.name === 'AbortError') return
        // Any other failure (share unsupported for this payload, permission) falls through to
        // the clipboard so the tap always does something observable.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard denied (rare) — nothing more we can do.
    }
  }

  if (!session) {
    return (
      <AppShell activeTab="live" header={<TopBar />} mainClassName="flex items-center px-4 py-6">
        <EmptyState
          className="w-full"
          title="This session has ended"
          body="Nothing is broadcasting on this link any more."
          action={
            <Link href="/live" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              See what is live
            </Link>
          }
        />
      </AppShell>
    )
  }

  const isFollowing = band ? followed.includes(band.id) : false
  const rating = ratings[session.id]
  const myRating = rating?.mine

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !session) return
    sendLiveComment(session.id, body)
    setDraft('')
  }

  return (
    <AppShell
      activeTab="live"
      liveIndicator
      surface="dark"
      background={
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.posterUrl}
            alt={`${band?.name ?? 'Live session'} — live now`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/90" />
        </>
      }
      header={
        <TopBar
          surface="dark"
          actions={
            <>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this session"
                className={iconButtonClass('dark')}
              >
                <Share2 size={14} />
              </button>
              <Link href="/live" aria-label="Close" className={iconButtonClass('dark')}>
                <X size={16} />
              </Link>
            </>
          }
        />
      }
      mainClassName="flex flex-col"
      footer={
        <form
          onSubmit={handleSend}
          className="pb-safe z-20 flex shrink-0 items-center gap-2 px-4 py-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment..."
            aria-label="Add a comment"
            className="h-10 flex-1 rounded-full border border-white/20 bg-white/10 px-4 text-[14px] text-white backdrop-blur-md placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
          />
          <button
            type="button"
            onClick={() => setRateOpen(true)}
            aria-label="Rate this jam"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md transition-transform active:scale-90"
          >
            <Star size={15} className="text-[#facc15]" fill={myRating ? 'currentColor' : 'none'} />
          </button>
          <button
            type="submit"
            disabled={draft.trim().length === 0}
            aria-label="Send comment"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-90 disabled:opacity-40"
          >
            <SendHorizontal size={15} />
          </button>
        </form>
      }
    >
      {/* Transient confirmation for the clipboard fallback of Share. */}
      {copied && (
        <div
          role="status"
          className="pointer-events-none fixed left-1/2 top-16 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[12px] font-medium text-white shadow-lg backdrop-blur-md"
        >
          Link copied
        </div>
      )}

      {/* BAND ROW */}
      <div className="flex items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              src={band?.coverUrl ?? session.posterUrl}
              name={band?.name ?? 'Live session'}
              ring={false}
              size="lg"
              className="h-[42px] w-[42px] border-2 border-white"
            />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-[3px] bg-live px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wider text-white shadow-md">
              Live
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate font-serif text-[17px] font-bold leading-tight text-white">
              {band?.name ?? 'Live session'}
            </h1>
            {/* The stream itself is seeded demo content — label it at the title. */}
            <DemoTagDark />
          </div>
        </div>
        {band && (
          <button
            type="button"
            onClick={() => toggleFollow(band.id)}
            className={cn(
              'shrink-0 rounded-full border border-white px-4 py-1.5 text-[12px] font-semibold transition-colors',
              isFollowing ? 'bg-white text-foreground' : 'text-white',
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* GLASS PILLS */}
      <div className="mt-6 flex flex-col items-start gap-2 px-4">
        {/* Rating shows only once at least one real rating is recorded — never the fixture value. */}
        {rating && rating.count >= 1 && (
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <Star size={12} className="text-[#facc15]" fill="currentColor" />
            <span className="text-[13px] font-bold text-white">{rating.avg.toFixed(1)}</span>
            <span className="ml-1 text-[10px] uppercase tracking-wider text-white/50">
              {rating.count === 1 ? '1 rating' : `${rating.count} ratings`}
            </span>
          </span>
        )}
        {venue && (
          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] text-white/80 backdrop-blur-md">
            {venue.name}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* CHAT RAIL — masked at the top so it fades into the video rather than cutting off. */}
      <div
        ref={chatRef}
        className="chat-mask no-scrollbar mb-2 flex max-h-[180px] flex-col gap-3 overflow-y-auto px-4"
      >
        {chat.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2.5">
            <Avatar
              src={
                getMusician(
                  // Handles map back to musicians where we have one; otherwise a neutral tile.
                  getMusicianByHandle(comment.handle)?.id ?? '',
                )?.avatarUrl ?? '/mock/bands/lunar-resonance.svg'
              }
              name={comment.handle}
              ring={false}
              size="xs"
              className="mt-0.5 border border-white/20"
            />
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 flex items-center gap-1.5 text-[10px] font-medium text-white/50">
                {comment.handle}
                {/* Seeded atmosphere lines are labelled; real members' lines are not. */}
                {comment.demo && <DemoTagDark />}
              </span>
              <p className="text-[13px] leading-tight text-white">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* RATE THIS JAM — docs/BUILD-PLAN.md P6-02. */}
      <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="Rate this jam">
        <h2 className="mb-2 text-center font-serif text-[20px] font-bold text-foreground">
          Rate this jam
        </h2>
        <p className="mb-6 text-center text-[13px] text-foreground-dim">
          Your feedback helps musicians build their reputation on Riff.
        </p>
        <StarInput value={stars || (myRating ?? 0)} onChange={setStars} />
        <div className="mt-6 flex flex-col gap-2">
          <Button
            fullWidth
            disabled={stars === 0}
            onClick={() => {
              rateSession(session.id, stars)
              setRateOpen(false)
            }}
          >
            Submit rating
          </Button>
          <Button fullWidth variant="ghost" onClick={() => setRateOpen(false)}>
            Not now
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
