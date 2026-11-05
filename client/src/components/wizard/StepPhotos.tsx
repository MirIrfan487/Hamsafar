import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import ErrorAlert from '../ErrorAlert'
import SecurePhoto from '../SecurePhoto'
import { ApiError } from '../../services/api'
import { ALLOWED_PHOTO_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES, photosApi, type MyPhoto, type PhotoStatus } from '../../services/photos'
import type { PhotoPrivacy } from '../../services/profile'
import { PHOTO_PRIVACY_OPTIONS, labelFor } from '../../utils/options'

const STATUS_BADGE: Record<PhotoStatus, { text: string; className: string }> = {
  Pending: { text: 'Waiting for approval', className: 'bg-amber-100 text-amber-900' },
  Approved: { text: 'Approved', className: 'bg-green-100 text-green-800' },
  Rejected: { text: 'Not approved', className: 'bg-red-100 text-red-800' },
}

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

// Photos are saved the moment they are uploaded, so this step has nothing to "save" at the end.
export default function StepPhotos({ photoPrivacy, onChangePrivacy }: { photoPrivacy: PhotoPrivacy; onChangePrivacy: () => void }) {
  const [photos, setPhotos] = useState<MyPhoto[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState<'upload' | number | null>(null) // what is being worked on right now
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const reload = async () => setPhotos(await photosApi.list())

  useEffect(() => {
    reload().catch((err) => setErrors(errorMessages(err)))
  }, [])

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so the same file can be chosen again
    if (!file) return

    // Quick checks in the browser; the server checks again (and checks it is a real image)
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return setErrors(['Only JPG, PNG or WEBP photos are allowed.'])
    if (file.size > MAX_PHOTO_BYTES) return setErrors(['Photo must be 5 MB or smaller.'])

    setErrors([])
    setBusy('upload')
    try {
      await photosApi.upload(file)
      await reload()
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setBusy(null)
    }
  }

  const run = async (id: number, action: () => Promise<void>) => {
    setErrors([])
    setBusy(id)
    try {
      await action()
      await reload()
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setBusy(null)
      setConfirmDeleteId(null)
    }
  }

  const count = photos?.length ?? 0
  const canAdd = photos !== null && count < MAX_PHOTOS

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-peach-50 p-4 text-sm text-ink-soft ring-1 ring-peach-200">
        <p>
          Photos are optional. Who can see them: <span className="font-semibold text-ink">{labelFor(PHOTO_PRIVACY_OPTIONS, photoPrivacy)}</span>
          {' '}
          <button type="button" onClick={onChangePrivacy} className="font-medium text-brand-600 hover:underline">
            Change
          </button>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Use a recent, clear photo of the face.</li>
          <li>No group photos, and no phone numbers or text on the photo.</li>
          <li>Our team checks every photo before other members can see it.</li>
          <li>Location data hidden inside phone photos is removed automatically.</li>
        </ul>
      </div>

      <ErrorAlert messages={errors} />

      {photos === null && errors.length === 0 && <p className="text-sm text-ink-soft">Loading photos…</p>}

      {photos !== null && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((p) => {
            const badge = STATUS_BADGE[p.status]
            const isBusy = busy === p.id
            return (
              <li key={p.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-peach-200">
                <div className="relative">
                  <SecurePhoto photoId={p.id} alt="Profile photo" className="aspect-[3/4] w-full object-cover" />
                  {p.isMain && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">Main photo</span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.text}</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                    {!p.isMain && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => run(p.id, () => photosApi.setMain(p.id))}
                        className="text-brand-600 hover:underline disabled:opacity-50"
                      >
                        Make main
                      </button>
                    )}
                    {confirmDeleteId === p.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => run(p.id, () => photosApi.remove(p.id))}
                          className="text-red-700 hover:underline disabled:opacity-50"
                        >
                          {isBusy ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-ink-soft hover:underline">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="text-red-700 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}

          {canAdd && (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy !== null}
                className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {busy === 'upload' ? 'Uploading…' : 'Add photo'}
                <span className="text-xs font-normal text-ink-soft">
                  {count} of {MAX_PHOTOS}, JPG/PNG/WEBP, max 5 MB
                </span>
              </button>
            </li>
          )}
        </ul>
      )}

      <input ref={fileInput} type="file" accept={ALLOWED_PHOTO_TYPES.join(',')} className="hidden" onChange={handleFile} />
    </div>
  )
}
