import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function DashboardOverviewPage() {
  redirect('/dashboard/orders')
}
