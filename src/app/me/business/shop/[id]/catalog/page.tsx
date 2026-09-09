import { CatalogManagerView } from '@/components/riff/CatalogManagerView'

export const metadata = { title: 'Manage catalog · Riff' }

export default async function CatalogManagerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CatalogManagerView shopId={id} />
}
