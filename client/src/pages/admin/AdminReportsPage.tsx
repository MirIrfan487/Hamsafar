import { useEffect, useState } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import Pager from '../../components/Pager'
import { adminApi, REPORT_REASON_LABELS, type AdminPersonRef, type AdminReport, type ReportStatus } from '../../services/admin'
import type { PagedResult } from '../../services/search'
import { errorText, formatDateTime } from './AdminLayout'

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: 'Open', label: 'Open' },
  { value: 'ActionTaken', label: 'Action taken' },
  { value: 'Dismissed', label: 'Dismissed' },
]

function Person({ label, person }: { label: string; person: AdminPersonRef }) {
  return (
    <div className="text-sm">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="font-medium text-ink">
        {person.name} <span className="font-normal text-ink-soft">· profile #{person.profileId}</span>
        {person.isSuspended && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs font-semibold text-red-700">Suspended</span>}
      </p>
      <p className="text-ink-soft">{person.email}</p>
    </div>
  )
}

function ReportCard({ report, onDone }: { report: AdminReport; onDone: () => void }) {
  const [note, setNote] = useState('')
  const [suspend, setSuspend] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const resolve = async (outcome: 'ActionTaken' | 'Dismissed') => {
    setBusy(true)
    setErrors([])
    try {
      await adminApi.resolveReport(report.id, outcome, note, outcome === 'ActionTaken' && suspend)
      onDone()
    } catch (e) {
      setErrors(errorText(e))
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border border-peach-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-ink">{REPORT_REASON_LABELS[report.reason]}</h2>
        <p className="text-xs text-ink-soft">
          Report #{report.id} · {formatDateTime(report.createdAtUtc)}
        </p>
      </div>
      {report.details && <p className="mt-2 whitespace-pre-line rounded-lg bg-peach-50 p-3 text-sm text-ink">{report.details}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Person label="Reported member" person={report.reported} />
        <Person label="Reported by" person={report.reporter} />
      </div>
      {report.reportsAgainstThisMember > 1 && (
        <p className="mt-3 text-sm font-medium text-red-700">This member has {report.reportsAgainstThisMember} reports in total.</p>
      )}

      {report.status === 'Open' ? (
        <div className="mt-4 space-y-3 border-t border-peach-100 pt-4">
          <ErrorAlert messages={errors} />
          <label htmlFor={`note-${report.id}`} className="block text-sm font-medium text-ink">
            Note for other admins (optional)
          </label>
          <textarea
            id={`note-${report.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {!report.reported.isSuspended && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={suspend} onChange={(e) => setSuspend(e.target.checked)} className="h-4 w-4 accent-brand-600" />
              Also suspend {report.reported.name} (they can no longer log in, and disappear from search and chat)
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => resolve('ActionTaken')}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Take action
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => resolve('Dismissed')}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        report.adminNote && <p className="mt-4 border-t border-peach-100 pt-3 text-sm text-ink-soft">Admin note: {report.adminNote}</p>
      )}
    </article>
  )
}

// /admin/reports — reports from members
export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('Open')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<AdminReport> | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const load = () => adminApi.reports(status, page).then(setData).catch((e) => setErrors(errorText(e)))
  useEffect(() => {
    setData(null)
    load()
  }, [status, page])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={status === t.value}
            onClick={() => {
              setStatus(t.value)
              setPage(1)
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === t.value ? 'bg-brand-600 text-white' : 'border border-gray-300 text-ink hover:bg-peach-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorAlert messages={errors} />
      {!data ? (
        !errors.length && <p className="text-ink-soft">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-peach-200">No reports here.</p>
      ) : (
        <>
          {data.items.map((r) => (
            <ReportCard key={r.id} report={r} onDone={load} />
          ))}
          <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
