import { PurchasesSection } from '@/components/dashboard/PurchasesSection'

export const dynamic = 'force-dynamic'

export default async function DashboardPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  return <PurchasesSection initialSearch={params.search || ''} />
}
