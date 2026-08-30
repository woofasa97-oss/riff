import type { Metadata } from 'next'
import { ComponentGallery } from '@/components/riff/ComponentGallery'

export const metadata: Metadata = { title: 'Components · Riff' }

/** Dev-only surface — a gallery of every primitive; not linked from the product chrome. */
export default function ComponentsPage() {
  return <ComponentGallery />
}
