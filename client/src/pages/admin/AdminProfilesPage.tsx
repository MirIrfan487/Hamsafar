import { useEffect, useState, type ReactNode } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import Pager from '../../components/Pager'
import SecurePhoto from '../../components/SecurePhoto'
import { adminApi, type AdminProfileReview } from '../../services/admin'
import type { PagedResult } from '../../services/search'
import {
  CREATED_BY_LABELS,
  MARITAL_STATUS_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SECT_OPTIONS,
  heightLabel,
  labelFor,
} from '../../utils/options'
import { errorText, formatDateTime } from './AdminLayout'

function Row({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-36 shrink-0 text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

function ProfileReviewCard({ p, onDone }: { p: AdminProfileReview; onDone: () => void }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setErrors([])
    try {
      await action()
      onDone()
    } catch (e) {
      setErrors(errorText(e))
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border border-peach-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {p.firstName} {p.lastName}, {p.age} <span className="text-sm font-normal text-ink-soft">({p.gender})</span>
          </h2>
          <p className="text-sm text-ink-soft">
            {p.userEmail} · {CREATED_BY_LABELS[p.profileFor]} · submitted {formatDateTime(p.updatedAtUtc)}
          </p>
        </div>
      </div>

      {p.photos.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {p.photos.map((ph) => (
            <div key={ph.id} className="relative">
              <SecurePhoto photoId={ph.id} alt={`Photo of ${p.firstName}`} className="h-32 w-28 rounded-lg object-cover" />
              <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 text-[10px] font-semibold text-ink">
                {ph.isMain ? 'Main · ' : ''}
                {ph.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">No photos uploaded.</p>
      )}

      <dl className="mt-4 grid gap-x-8 gap-y-1.5 md:grid-cols-2">
        <Row label="Date of birth">{p.dateOfBirth}</Row>
        <Row label="Marital status">{labelFor(MARITAL_STATUS_OPTIONS, p.maritalStatus)}</Row>
        <Row label="Height">{p.heightCm ? heightLabel(String(p.heightCm)) : null}</Row>
        <Row label="Location">{[p.city, p.state, p.country].filter(Boolean).join(', ')}</Row>
        <Row label="Education">{p.education}</Row>
        <Row label="Occupation">{p.occupation}</Row>
        <Row label="Sect">{p.sect ? labelFor(SECT_OPTIONS, p.sect) : null}</Row>
        <Row label="Religious practice">{p.religiosity ? labelFor(RELIGIOSITY_OPTIONS, p.religiosity) : null}</Row>
        <Row label="Mother tongue">{p.motherTongue}</Row>
        <Row label="Father">{p.fatherOccupation}</Row>
        <Row label="Mother">{p.motherOccupation}</Row>
        <Row label="Brothers / sisters">
          {p.brothers == null && p.sisters == null ? null : `${p.brothers ?? 0} / ${p.sisters ?? 0}`}
        </Row>
      </dl>
      {p.aboutMe && <p className="mt-3 whitespace-pre-line rounded-lg bg-peach-50 p-3 text-sm text-ink">{p.aboutMe}</p>}
      {p.familyDetails && <p className="mt-2 whitespace-pre-line rounded-lg bg-peach-50 p-3 text-sm text-ink">{p.familyDetails}</p>}

      <div className="mt-4 space-y-3">
        <ErrorAlert messages={errors} />
        {rejecting ? (
          <div className="space-y-2">
            <label htmlFor={`reason-${p.id}`} className="block text-sm font-medium text-ink">
              What should the member change? (they will see this)
            </label>
            <textarea
              id={`reason-${p.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !reason.trim()}
                onClick={() => run(() => adminApi.rejectProfile(p.id, reason.trim()))}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Send back for changes
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="rounded-full px-4 py-2 text-sm text-ink-soft hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => adminApi.approveProfile(p.id))}
              className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejecting(true)}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-ink hover:bg-peach-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

// /admin/profiles — profiles waiting for approval, oldest first
export default function AdminProfilesPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<AdminProfileReview> | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const load = () => adminApi.pendingProfiles(page).then(setData).catch((e) => setErrors(errorText(e)))
  useEffect(() => {
    load()
  }, [page])

  if (errors.length) return <ErrorAlert messages={errors} />
  if (!data) return <p className="text-ink-soft">Loading…</p>
  if (data.items.length === 0) return <p className="rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-peach-200">No profiles are waiting for review.</p>

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">{data.totalCount} profile(s) waiting, oldest first. Review new photos in the Photos tab.</p>
      {data.items.map((p) => (
        <ProfileReviewCard key={p.id} p={p} onDone={load} />
      ))}
      <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  )
}
