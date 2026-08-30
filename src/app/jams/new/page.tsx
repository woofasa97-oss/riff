import type { Metadata } from 'next'
import { PostJamView } from '@/components/riff/PostJamView'

export const metadata: Metadata = { title: 'Post a jam · Riff' }

export default function NewJamPage() {
  return <PostJamView />
}
