import { BookBandView } from '@/components/riff/BookBandView'

export const metadata = { title: 'Book a band · Riff' }

export default async function BookBandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BookBandView shopId={id} />
}
