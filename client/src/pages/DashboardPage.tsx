import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import BlockedMembers from '../components/BlockedMembers'
import { HeroArch } from '../components/Decor'
import { useAuth } from '../hooks/useAuth'
import { isAdminOnly } from '../services/auth'
import { ApiError } from '../services/api'
import { profileApi, type MyProfile, type ProfileStatus } from '../services/profile'
import { interestsApi, type InterestSummary } from '../services/interests'
import { paymentsApi, type MySubscription } from '../services/payments'
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
  const [plan, setPlan] = useState<MySubscription | null>(null)

  const adminOnly = user ? isAdminOnly(user) : false

  useEffect(() => {
    if (adminOnly) return
    interestsApi.summary().then(setInterests).catch(() => setInterests(null))
    paymentsApi.mine().then(setPlan).catch(() => setPlan(null))
  }, [])

  useEffect(() => {
    if (adminOnly) return
    profileApi
      .getMine()
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']))
  }, [])

  if (!user) return null
  if (adminOnly) return <Navigate to="/admin" replace />

  const isComplete = profile ? profile.missingFields.length === 0 : false
  const buttonText = !profile ? '' : profile.status === 'Draft' && !isComplete ? 'Complete your profile' : 'Edit profile'

  const counts = [
    { tab: 'Received', value: interests?.receivedPending, label: 'Waiting for your reply' },
    { tab: 'Sent', value: interests?.sentPending, label: 'Sent, awaiting a reply' },
    { tab: 'Connected', value: interests?.connected, label: 'Connected' },
  ]

  return (
    <>
      {/* ---------- Welcome hero (same look as the home page hero) ---------- */}
      <section className="on-dark relative overflow-hidden border-b border-gold/25 bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="pointer-events-none absolute -right-24 top-1/4 hidden h-96 w-96 rounded-full bg-gold/10 blur-3xl lg:block" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:py-14 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Your dashboard
              <span className="h-px w-10 bg-gold" aria-hidden="true" />
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Welcome, <span className="italic text-gold">{user.firstName}</span>
            </h1>
            <p className="mt-4 max-w-lg leading-relaxed text-white/80">
              Search for matches, reply to interests and keep your profile up to date.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="flex items-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-bold text-brand-900 hover:bg-accent-400"
              >
                Search profiles
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </Link>
              {profile && (
                <Link
                  to={`/profiles/${profile.id}`}
                  className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Preview my profile
                </Link>
              )}
            </div>

            {/* Interest counts, in the same framed panel as the home page search */}
            <div className="relative mt-9 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] sm:p-6">
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-gold" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Your interests</h2>
              <ul className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
                {counts.map((c) => (
                  <li key={c.tab}>
                    <Link to={`/interests?tab=${c.tab}`} className="group block rounded-lg">
                      <span className="block font-display text-4xl font-bold lining-nums text-gold">{c.value ?? '–'}</span>
                      <span className="mt-1 block text-xs leading-snug text-white/80 group-hover:text-white">{c.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <HeroArch className="mx-auto hidden w-full max-w-sm lg:block" />
        </div>
      </section>

      {/* ---------- Details ---------- */}
      <div className="bg-peach-50">
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-10">
          <ErrorAlert messages={error} />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
              !error.length && <div className="rounded-2xl border border-peach-200 bg-white p-5 text-sm text-ink-soft">Loading your profile…</div>
            )}

            <div className="rounded-2xl border border-peach-200 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Your plan</p>
              {plan?.isPremium && plan.premiumUntilUtc ? (
                <p className="mt-1 text-sm text-ink-soft">
                  {plan.planName}, active until {new Date(plan.premiumUntilUtc).toLocaleDateString()}.
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">
                  Free. Upgrade to chat and see contact details of your matches. Both members need Premium to chat.
                </p>
              )}
              <Link
                to="/plans"
                className="mt-4 inline-block rounded-full border border-brand-200 px-5 py-2 text-sm font-medium text-ink hover:bg-peach-50"
              >
                {plan?.isPremium ? 'Manage plan' : 'See plans'}
              </Link>
            </div>

            <div className="rounded-2xl border border-peach-200 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Your account</p>
              <p className="mt-1 break-words text-sm text-ink-soft">{user.email}</p>
              <p className="mt-1 text-sm text-ink-soft">Role: {user.roles.join(', ')}</p>
            </div>

            <BlockedMembers />
          </div>
        </div>
      </div>
    </>
  )
}
