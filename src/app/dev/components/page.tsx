import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ComponentGallery } from '@/components/riff/ComponentGallery'

export const metadata: Metadata = { title: 'Components · Riff' }

/**
 * Dev-only surface — a gallery of every primitive; not linked from the product chrome. Hidden in
 * production so it never ships as a public URL. Set RIFF_SHOW_DEV=1 to view it on a deploy.
 */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production' && process.env.RIFF_SHOW_DEV !== '1') {
    notFound()
  }
  return <ComponentGallery />
}
