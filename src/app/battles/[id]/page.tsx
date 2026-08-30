import { BattleView } from '@/components/riff/BattleView'

export const metadata = { title: 'Battle · Riff' }

export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BattleView battleId={id} />
}
