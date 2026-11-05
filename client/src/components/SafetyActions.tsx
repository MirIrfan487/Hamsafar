import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import ErrorAlert from './ErrorAlert'
import { ApiError } from '../services/api'
import { REPORT_REASON_LABELS, type ReportReason } from '../services/admin'
import { safetyApi } from '../services/safety'

const REASONS = Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][]

// "Report" and "Block" links at the bottom of another member's profile
export default function SafetyActions({ profileId, name }: { profileId: number; name: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState<'none' | 'report' | 'block'>('none')
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [reported, setReported] = useState(false)

  const fail = (err: unknown) => setErrors(err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?'])

  const submitReport = async (e: FormEvent) => {
    e.preventDefault()
    if (!reason) return setErrors(['Please choose a reason.'])
    setBusy(true)
    setErrors([])
    try {
      await safetyApi.report(profileId, reason, details)
      setReported(true)
      setOpen('none')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const block = async () => {
    setBusy(true)
    setErrors([])
    try {
      await safetyApi.block(profileId)
      navigate('/search', { replace: true })
    } catch (err) {
      fail(err)
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-peach-200 sm:p-6">
      <h2 className="font-semibold text-ink">Safety</h2>
      {reported && (
        <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Thank you. Our team will review your report. You can also block {name} so you no longer see each other.
        </p>
      )}

      {open === 'none' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {!reported && (
            <button
              type="button"
              onClick={() => setOpen('report')}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50"
            >
              Report profile
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen('block')}
            className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Block {name}
          </button>
        </div>
      )}

      {open === 'report' && (
        <form onSubmit={submitReport} className="mt-3 space-y-3">
          <div>
            <label htmlFor="report-reason" className="block text-sm font-medium text-ink">
              What is wrong with this profile?
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Choose a reason</option>
              {REASONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-details" className="block text-sm font-medium text-ink">
              Details (optional)
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-soft">Only our team sees this. {name} is not told who reported them.</p>
          </div>
          <ErrorAlert messages={errors} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              Send report
            </button>
            <button type="button" onClick={() => setOpen('none')} className="px-3 text-sm text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}

      {open === 'block' && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-ink">
            Block {name}? You will no longer see each other in search, interests or messages. You can unblock later from your dashboard.
          </p>
          <ErrorAlert messages={errors} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={block} className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              Yes, block
            </button>
            <button type="button" onClick={() => setOpen('none')} className="px-3 text-sm text-ink-soft hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
