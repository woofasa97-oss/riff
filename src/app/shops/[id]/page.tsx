import { ShopView } from '@/components/riff/ShopView'
import { getMusicShop } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shop = getMusicShop(id)
  return { title: shop ? `${shop.name} · Riff` : 'Shop · Riff' }
}

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShopView shopId={id} />
}
