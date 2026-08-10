import { isDashSqlEnabled } from '@/lib/db-query'
import { SqlSection } from '@/components/dashboard/SqlSection'

export const dynamic = 'force-dynamic'

export default function DashboardSqlPage() {
  if (!isDashSqlEnabled()) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-zinc-50">Query SQL</h1>
        <p className="text-sm text-zinc-400">
          La sezione SQL è disabilitata in questo ambiente.
        </p>
      </div>
    )
  }
  return <SqlSection />
}
