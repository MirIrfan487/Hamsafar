import { useEffect, useState } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import Pager from '../../components/Pager'
import SecurePhoto from '../../components/SecurePhoto'
import { adminApi, type AdminPhoto } from '../../services/admin'
import type { PagedResult } from '../../services/search'
import { errorText, formatDateTime } from './AdminLayout'

// Kept in the activity log so other admins can see why a photo was rejected
const PHOTO_REJECT_REASONS = [
  'Face not clearly visible',
  'Not a photo of the member',
  'Inappropriate or immodest',
  'Contains contact details or text',
  'Low quality',
]

function PhotoTile({ photo, onDone }: { photo: AdminPhoto; onDone: () => void }) {
  const [reason, setReason] = useState(PHOTO_REJECT_REASONS[0])
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
    <div className="overflow-hidden rounded-2xl border border-peach-200 bg-white">
      <SecurePhoto photoId={photo.id} alt={`Photo uploaded by ${photo.profileName}`} className="aspect-[4/5] w-full object-cover" />
      <div className="space-y-2 p-3">
        <p className="text-sm font-medium text-ink">
          {photo.profileName} <span className="font-normal text-ink-soft">· profile #{photo.profileId}</span>
        </p>
        <p className="text-xs text-ink-soft">
          {photo.isMain ? 'Main photo · ' : ''}
          {formatDateTime(photo.uploadedAtUtc)}
        </p>
        <ErrorAlert messages={errors} />
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => adminApi.approvePhoto(photo.id))}
          className="w-full rounded-full bg-brand-600 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Approve
        </button>
        <div className="flex gap-1">
          <select
            aria-label="Reason for rejecting"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs"
          >
            {PHOTO_REJECT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => adminApi.rejectPhoto(photo.id, reason))}
            className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

// /admin/photos — new photos waiting for review. Members only see approved photos.
export default function AdminPhotosPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<AdminPhoto> | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const load = () => adminApi.pendingPhotos(page).then(setData).catch((e) => setErrors(errorText(e)))
  useEffect(() => {
    load()
  }, [page])

  if (errors.length) return <ErrorAlert messages={errors} />
  if (!data) return <p className="text-ink-soft">Loading…</p>
  if (data.items.length === 0) return <p className="rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-peach-200">No photos are waiting for review.</p>

  return (
    <div>
      <p className="text-sm text-ink-soft">{data.totalCount} photo(s) waiting, oldest first.</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.items.map((p) => (
          <PhotoTile key={p.id} photo={p} onDone={load} />
        ))}
      </div>
      <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  )
}
