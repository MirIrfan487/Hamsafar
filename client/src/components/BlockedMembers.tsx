import { useEffect, useState } from 'react'
import { safetyApi, type BlockedMember } from '../services/safety'

// Dashboard card: people I blocked, with an Unblock button
export default function BlockedMembers() {
  const [list, setList] = useState<BlockedMember[] | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => safetyApi.blocked().then(setList).catch(() => setList([]))
  useEffect(() => {
    load()
  }, [])

  const unblock = async (profileId: number) => {
    setBusyId(profileId)
    try {
      await safetyApi.unblock(profileId)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  // Nothing to show until someone is blocked
  if (!list || list.length === 0) return null

  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm font-semibold text-ink">Blocked members</p>
      <ul className="mt-2 divide-y divide-peach-100">
        {list.map((b) => (
          <li key={b.profileId} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-ink">
              {b.displayName} <span className="text-ink-soft">· {b.city}</span>
            </span>
            <button
              type="button"
              disabled={busyId === b.profileId}
              onClick={() => unblock(b.profileId)}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-ink hover:bg-peach-50 disabled:opacity-50"
            >
              Unblock
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
