import { useEffect, useState } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import Pager from '../../components/Pager'
import { adminApi, type AuditLogItem } from '../../services/admin'
import type { PagedResult } from '../../services/search'
import { errorText, formatDateTime } from './AdminLayout'

// "ApproveProfile" -> "Approve profile"
const readable = (action: string) => action.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ (\w)/g, (_, c: string) => ` ${c.toLowerCase()}`)

// /admin/activity — every admin action, newest first
export default function AdminActivityPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<AuditLogItem> | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    adminApi.audit(page).then(setData).catch((e) => setErrors(errorText(e)))
  }, [page])

  if (errors.length) return <ErrorAlert messages={errors} />
  if (!data) return <p className="text-ink-soft">Loading…</p>
  if (data.items.length === 0) return <p className="rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-peach-200">No admin actions yet.</p>

  return (
    <div>
      <ul className="divide-y divide-peach-100 rounded-2xl border border-peach-200 bg-white">
        {data.items.map((a) => (
          <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <div>
              <p className="text-ink">
                <span className="font-medium">{readable(a.action)}</span>{' '}
                <span className="text-ink-soft">
                  {a.targetType} #{a.targetId}
                </span>
              </p>
              {a.note && <p className="mt-0.5 text-ink-soft">“{a.note}”</p>}
            </div>
            <p className="text-ink-soft">
              {a.adminEmail} · {formatDateTime(a.createdAtUtc)}
            </p>
          </li>
        ))}
      </ul>
      <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  )
}
