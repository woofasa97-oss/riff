'use client'

import Link from 'next/link'
import { ChevronRight, GraduationCap, Laptop, MapPin } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/Button'
import { instrumentLabel } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { getMusician } from '@/mocks'
import type { TeacherProfile } from '@/types'

/**
 * The teacher directory — musicians from the scene who take students. Every card is backed by
 * a real Riff profile, so a teacher's reputation is one tap away from their pitch.
 */
export function TeachersView() {
  const teachers = useRiffStore((s) => s.teachers)
  const viewerId = useRiffStore((s) => s.viewerId)
  const visible = teachers.filter((t) => t.active)

  return (
    <AppShell
      activeTab="discover"
      header={<SubScreenHeader title="Find a teacher" backHref="/discover" />}
      mainClassName="px-4 py-6"
    >
      <p className="mb-5 px-1 text-[14px] text-foreground-dim">
        Lessons from players in the scene — the same people you&apos;ll meet at jams.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          className="w-full"
          icon={<GraduationCap size={22} />}
          title="No teachers listed yet"
          body="Teachers from the scene will show up here as they list themselves."
        />
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
          {visible.map((t) => (
            <TeacherCard key={t.musicianId} teacher={t} />
          ))}
        </div>
      )}

      {viewerId && !teachers.some((t) => t.musicianId === viewerId) && (
        <div className="mt-8 text-center">
          <p className="mb-2 text-[13px] text-foreground-dim">Teach an instrument yourself?</p>
          <Link href="/me/business/teacher" className={buttonClass({ variant: 'outline', size: 'sm' })}>
            <GraduationCap size={15} />
            Teach on Riff
          </Link>
        </div>
      )}
    </AppShell>
  )
}

function TeacherCard({ teacher }: { teacher: TeacherProfile }) {
  const musician = getMusician(teacher.musicianId)
  if (!musician) return null
  return (
    <Link
      href={`/teachers/${teacher.musicianId}`}
      className="block transition-transform active:scale-[0.99]"
    >
      <Card className="flex items-center gap-3 p-4">
        <Avatar src={musician.avatarUrl} name={musician.name} size="lg" ring={false} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-[15px] font-bold text-foreground">
            {musician.name}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-foreground-dim">{teacher.headline}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-foreground-dim">
            <span className="font-bold text-primary">
              {teacher.instruments.map(instrumentLabel).join(' · ')}
            </span>
            <span>${teacher.ratePerHourUsd}/hr</span>
            {teacher.online && (
              <span className="flex items-center gap-0.5">
                <Laptop size={10} /> Online
              </span>
            )}
            {teacher.inPerson && (
              <span className="flex items-center gap-0.5">
                <MapPin size={10} /> {musician.neighborhood}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-foreground-dim" />
      </Card>
    </Link>
  )
}
