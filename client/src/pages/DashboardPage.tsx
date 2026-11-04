import { useAuth } from '../hooks/useAuth'

// Only reachable when logged in (see ProtectedRoute in App.tsx)
export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Welcome, {user.firstName}</h1>
        <p className="mt-1 text-gray-600">This is your dashboard.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-800">Profile status: Draft</p>
          <p className="mt-1 text-sm text-amber-700">
            Complete your profile so it can be reviewed and shown to other members.
          </p>
          <p className="mt-3 text-xs text-amber-600">Profile wizard coming in Phase 3.</p>
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
