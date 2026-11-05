import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import ErrorAlert from '../../components/ErrorAlert'
import { adminApi, type AdminStats } from '../../services/admin'
import { errorText } from './AdminLayout'

function Stat({ label, value, to, highlight }: { label: string; value: string | number; to?: string; highlight?: boolean }) {
  const body = (
    <div className={`rounded-2xl border bg-white p-5 ${highlight ? 'border-accent-400' : 'border-peach-200'} ${to ? 'hover:bg-peach-50' : ''}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

// /admin — counts that need attention first, then totals
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setErrors(errorText(e)))
  }, [])

  if (errors.length) return <ErrorAlert messages={errors} />
  if (!stats) return <p className="text-ink-soft">Loading…</p>

  const rupees = (stats.revenueThisMonthInPaise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Needs attention</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Stat label="Profiles waiting for review" value={stats.pendingProfiles} to="/admin/profiles" highlight={stats.pendingProfiles > 0} />
          <Stat label="Photos waiting for review" value={stats.pendingPhotos} to="/admin/photos" highlight={stats.pendingPhotos > 0} />
          <Stat label="Open reports" value={stats.openReports} to="/admin/reports" highlight={stats.openReports > 0} />
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Members</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total members" value={stats.totalMembers} to="/admin/members" />
          <Stat label="Joined in the last 7 days" value={stats.newMembersLast7Days} />
          <Stat label="Approved profiles" value={stats.approvedProfiles} />
          <Stat label="Premium members now" value={stats.activePremiumMembers} />
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Payments</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Stat label="Revenue this month (verified payments)" value={rupees} />
        </div>
      </section>
    </div>
  )
}
