import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

// Wrap admin pages. Not logged in -> /login. Logged in but not an admin -> /dashboard.
// (This only hides the pages. The real protection is [Authorize(Roles = "Admin")] on the API.)
export default function AdminRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="p-10 text-center text-gray-500">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.roles.includes('Admin')) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
