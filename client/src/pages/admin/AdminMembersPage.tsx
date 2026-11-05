import { useEffect, useState, type FormEvent } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import Pager from '../../components/Pager'
import { adminApi, type AdminMember } from '../../services/admin'
import type { PagedResult } from '../../services/search'
import { STATUS_LABELS } from '../../utils/options'
import { errorText, formatDateTime } from './AdminLayout'

function MemberRow({ m, onDone }: { m: AdminMember; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState('')

  const run = async (suspend: boolean) => {
    setBusy(true)
    setErrors([])
    try {
      await (suspend ? adminApi.suspend(m.userId, note) : adminApi.unsuspend(m.userId))
      setConfirming(false)
      onDone()
    } catch (e) {
      setErrors(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className="border-t border-peach-100 align-top">
      <td className="py-3 pr-3">
        <p className="font-medium text-ink">
          {m.firstName} <span className="font-normal text-ink-soft">({m.gender}, {m.city || 'no city'}) · profile #{m.profileId}</span>
        </p>
        <p className="text-ink-soft">{m.email}</p>
        <ErrorAlert messages={errors} />
      </td>
      <td className="py-3 pr-3">
        <p>{STATUS_LABELS[m.profileStatus]}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {m.isPremium && <span className="rounded bg-brand-50 px-1.5 text-xs font-semibold text-brand-700">Premium</span>}
          {m.isSuspended && <span className="rounded bg-red-100 px-1.5 text-xs font-semibold text-red-700">Suspended</span>}
        </div>
      </td>
      <td className="py-3 pr-3 text-ink-soft">
        <p>Joined {formatDateTime(m.joinedAtUtc)}</p>
        <p>{m.lastActiveAtUtc ? `Last login ${formatDateTime(m.lastActiveAtUtc)}` : 'Never logged in again'}</p>
      </td>
      <td className="py-3 text-right">
        {m.isSuspended ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(false)}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-50"
          >
            Unsuspend
          </button>
        ) : confirming ? (
          <div className="ml-auto flex w-56 flex-col gap-1">
            <input
              aria-label={`Reason for suspending ${m.firstName}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Reason (for the activity log)"
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            />
            <div className="flex justify-end gap-1">
              <button type="button" onClick={() => setConfirming(false)} className="px-2 text-sm text-ink-soft hover:text-ink">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(true)}
                className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Suspend
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Suspend
          </button>
        )}
      </td>
    </tr>
  )
}

// /admin/members — find a member by name or email, suspend / unsuspend
export default function AdminMembersPage() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<AdminMember> | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const load = () => adminApi.members(query, page).then(setData).catch((e) => setErrors(errorText(e)))
  useEffect(() => {
    load()
  }, [query, page])

  const search = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQuery(input.trim())
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <label htmlFor="member-search" className="sr-only">
          Search by name or email
        </label>
        <input
          id="member-search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name or email"
          className="w-full max-w-md rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button type="submit" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      <ErrorAlert messages={errors} />
      {!data ? (
        !errors.length && <p className="text-ink-soft">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-ink-soft ring-1 ring-peach-200">No members found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-peach-200 bg-white px-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="py-3 font-medium">Member</th>
                <th className="py-3 font-medium">Profile</th>
                <th className="py-3 font-medium">Activity</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <MemberRow key={m.userId} m={m} onDone={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  )
}
