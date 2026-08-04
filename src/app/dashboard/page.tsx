import { isAuthed } from '@/lib/dash-auth'
import DashboardLogin from './login'
import DashboardMain from './main'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const authed = await isAuthed()

  if (!authed) {
    const { error } = await searchParams
    return <DashboardLogin error={error} />
  }

  return <DashboardMain />
}
