import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'
import { profileApi, type MyProfile, type ProfileStatus } from '../services/profile'
import { interestsApi, type InterestSummary } from '../services/interests'
import { STATUS_LABELS } from '../utils/options'

// What to tell the user for each profile status
const STATUS_TEXT: Record<ProfileStatus, string> = {
  Draft: 'Complete your profile and submit it. Our team reviews it before other members can see it.',
  PendingApproval: 'Your profile is waiting for approval. It will appear in search once our team approves it.',
  Approved: 'Your profile is live and visible to other members.',
  Rejected: 'Our team asked for some changes. Edit your profile and submit it again.',
}

const STATUS_STYLE: Record<ProfileStatus, string> = {
  Draft: 'border-amber-200 bg-amber-50',
  PendingApproval: 'border-brand-200 bg-brand-50',
  Approved: 'border-green-200 bg-green-50',
  Rejected: 'border-red-200 bg-red-50',
}

// Only reachable when logged in (see ProtectedRoute in App.tsx)
export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [error, setError] = useState<string[]>([])
  const [interests, setInterests] = useState<InterestSummary | null>(null)

  useEffect(() => {
    interestsApi.summary().then(setInterests).catch(() => setInterests(null))
  }, [])

  useEffect(() => {
    profileApi
      .getMine()
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']))
  }, [])

  if (!user) return null

  const isComplete = profile ? profile.missingFields.length === 0 : false
  const buttonText = !profile ? '' : profile.status === 'Draft' && !isComplete ? 'Complete your profile' : 'Edit profile'

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Welcome, {user.firstName}</h1>
        <p className="mt-1 text-gray-600">This is your dashboard.</p>
      </div>

      <ErrorAlert messages={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        {profile ? (
          <div className={`rounded-2xl border p-5 ${STATUS_STYLE[profile.status]}`}>
            <p className="text-sm font-semibold text-ink">Profile status: {STATUS_LABELS[profile.status]}</p>
            <p className="mt-1 text-sm text-ink-soft">{STATUS_TEXT[profile.status]}</p>
            {profile.status === 'Rejected' && profile.rejectionReason && (
              <p className="mt-2 text-sm text-red-800">Reason: {profile.rejectionReason}</p>
            )}
            {profile.status === 'Draft' && !isComplete && (
              <p className="mt-2 text-xs text-ink-soft">{profile.missingFields.length} item(s) left to complete.</p>
            )}
            <Link
              to={profile.status === 'Draft' && isComplete ? '/profile/edit?step=7' : '/profile/edit'}
              className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {profile.status === 'Draft' && isComplete ? 'Review and submit' : buttonText}
            </Link>
          </div>
        ) : (
          !error.length && <div className="rounded-2xl border bg-white p-5 text-sm text-ink-soft">Loading your profile…</div>
        )}

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold text-ink">Find matches</p>
          <p className="mt-1 text-sm text-ink-soft">Search approved profiles by age, city, education and religious practice.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/search" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Search profiles
            </Link>
            {profile && (
              <Link
                to={`/profiles/${profile.id}`}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-ink hover:bg-peach-50"
              >
                Preview my profile
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold text-ink">Interests</p>
          {interests ? (
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              <li>
                <Link to="/interests?tab=Received" className="hover:text-brand-700">
                  <span className="font-semibold text-ink">{interests.receivedPending}</span> waiting for your reply
                </Link>
              </li>
              <li>
                <Link to="/interests?tab=Sent" className="hover:text-brand-700">
                  <span className="font-semibold text-ink">{interests.sentPending}</span> sent, waiting for a reply
                </Link>
              </li>
              <li>
                <Link to="/interests?tab=Connected" className="hover:text-brand-700">
                  <span className="font-semibold text-ink">{interests.connected}</span> connected
                </Link>
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Loading…</p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Your account</p>
          <p className="mt-1 text-ink">{user.email}</p>
          <p className="mt-1 text-sm text-gray-500">Role: {user.roles.join(', ')}</p>
        </div>
      </div>
    </div>
  )
}
