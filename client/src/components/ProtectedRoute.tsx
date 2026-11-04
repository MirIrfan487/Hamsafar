import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

// Wrap pages that need login. Not logged in -> go to /login,
// and remember where the user wanted to go so we can send them back after login.
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="p-10 text-center text-gray-500">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}
