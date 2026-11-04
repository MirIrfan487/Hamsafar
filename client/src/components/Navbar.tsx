import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-rose-100 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-semibold text-rose-700">
          Matrimony
        </Link>

        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="text-gray-700 hover:text-rose-700">
              Dashboard
            </Link>
            <span className="hidden text-gray-500 sm:inline">{user.firstName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="text-gray-700 hover:text-rose-700">
              Log in
            </Link>
            <Link to="/register" className="rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700">
              Register free
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
