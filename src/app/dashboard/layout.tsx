import { isAuthed } from '@/lib/dash-auth'
import DashboardLogin from './login'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed()

  if (!authed) {
    return <DashboardLogin />
  }

  return <DashboardShell>{children}</DashboardShell>
}
