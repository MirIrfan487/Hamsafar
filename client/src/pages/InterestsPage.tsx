import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import SecurePhoto from '../components/SecurePhoto'
import { PhotoPlaceholder } from '../components/ProfileCard'
import { ApiError } from '../services/api'
import { interestsApi, type Interest, type InterestBox, type InterestStatus, type InterestSummary } from '../services/interests'

const TABS: { box: InterestBox; label: string; empty: string }[] = [
  { box: 'Received', label: 'Received', empty: 'No one has sent you an interest yet.' },
  { box: 'Sent', label: 'Sent', empty: 'You have not sent any interests yet.' },
  { box: 'Connected', label: 'Connected', empty: 'When an interest is accepted, the member appears here.' },
]

const STATUS_BADGE: Record<InterestStatus, { text: string; className: string }> = {
  Pending: { text: 'Waiting for reply', className: 'bg-amber-100 text-amber-900' },
  Accepted: { text: 'Connected', className: 'bg-green-100 text-green-800' },
  Rejected: { text: 'Declined', className: 'bg-gray-100 text-gray-700' },
  Withdrawn: { text: 'Withdrawn', className: 'bg-gray-100 text-gray-700' },
}

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

// /interests?tab=Received|Sent|Connected
export default function InterestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const box: InterestBox = tabParam === 'Sent' || tabParam === 'Connected' ? tabParam : 'Received'

  const [items, setItems] = useState<Interest[] | null>(null)
  const [summary, setSummary] = useState<InterestSummary | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async (which: InterestBox) => {
    const [list, counts] = await Promise.all([interestsApi.list(which), interestsApi.summary()])
    setItems(list)
    setSummary(counts)
  }

  useEffect(() => {
    setItems(null)
    setErrors([])
    load(box).catch((err) => setErrors(errorMessages(err)))
  }, [box]) // reload when the tab changes

  const act = async (id: number, action: () => Promise<unknown>) => {
    setErrors([])
    setBusyId(id)
    try {
      await action()
      await load(box)
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setBusyId(null)
    }
  }

  const countFor = (b: InterestBox) =>
    !summary ? null : b === 'Received' ? summary.receivedPending : b === 'Sent' ? summary.sentPending : summary.connected
  const current = TABS.find((t) => t.box === box)!

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Interests</h1>

      <div role="tablist" aria-label="Interest lists" className="mt-5 flex gap-1 rounded-full bg-peach-100 p-1">
        {TABS.map((t) => {
          const active = t.box === box
          const count = countFor(t.box)
          return (
            <button
              key={t.box}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setSearchParams({ tab: t.box })}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${active ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
            >
              {t.label}
              {count ? <span className="ml-1.5 rounded-full bg-accent-500 px-1.5 text-xs font-semibold text-white">{count}</span> : null}
            </button>
          )
        })}
      </div>
      {summary && box !== 'Connected' && (
        <p className="mt-2 text-xs text-ink-soft">The number shows interests that are still waiting for a reply.</p>
      )}

      <div className="mt-6 space-y-4">
        <ErrorAlert messages={errors} />

        {items === null && errors.length === 0 && <p className="text-ink-soft">Loading…</p>}

        {items?.length === 0 && (
          <div className="rounded-2xl bg-peach-50 p-8 text-center ring-1 ring-peach-200">
            <p className="text-ink">{current.empty}</p>
            <Link to="/search" className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Search profiles
            </Link>
          </div>
        )}

        {items?.map((it) => {
          const p = it.otherProfile
          const badge = STATUS_BADGE[it.status]
          const busy = busyId === it.id
          return (
            <article key={it.id} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-peach-200">
              <Link to={`/profiles/${p.id}`} className="w-20 shrink-0 sm:w-24">
                {p.photoId ? (
                  <SecurePhoto photoId={p.photoId} alt={`Photo of ${p.displayName}`} className="aspect-square w-full rounded-xl object-cover" />
                ) : (
                  <PhotoPlaceholder name={p.displayName} locked={false} className="aspect-square w-full rounded-xl [&>span:last-child]:hidden" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/profiles/${p.id}`} className="font-semibold text-ink hover:text-brand-700">
                    {p.displayName}, {p.age}
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.text}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">{[p.city, p.occupation].filter(Boolean).join(', ')}</p>
                {it.note && <p className="mt-2 whitespace-pre-line rounded-lg bg-peach-50 p-2 text-sm text-ink">“{it.note}”</p>}
                <p className="mt-2 text-xs text-ink-soft">
                  {it.direction === 'Sent' ? 'You sent this' : 'Received'} on {formatDate(it.createdAtUtc)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {it.direction === 'Received' && it.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(it.id, () => interestsApi.accept(it.id))}
                        className="rounded-full bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(it.id, () => interestsApi.reject(it.id))}
                        className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-60"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {it.direction === 'Sent' && it.status === 'Pending' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(it.id, () => interestsApi.withdraw(it.id))}
                      className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-60"
                    >
                      Withdraw
                    </button>
                  )}
                  <Link
                    to={`/profiles/${p.id}`}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
