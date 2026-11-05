import { Link, useNavigate } from 'react-router'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'

// Section links point to anchors on the home page (works from any page)
const SECTION_LINKS = [
  { href: '/#why', label: 'Why us' },
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { unreadCount } = useChat()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-peach-100 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <ul className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {SECTION_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-brand-600">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {user ? (
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <Link to="/search" className="font-medium text-ink hover:text-brand-600">
              Search
            </Link>
            <Link to="/interests" className="font-medium text-ink hover:text-brand-600">
              Interests
            </Link>
            <Link to="/chat" className="flex items-center gap-1 font-medium text-ink hover:text-brand-600">
              Messages
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent-500 px-1.5 text-xs font-semibold text-white" aria-label={`${unreadCount} unread`}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link to="/dashboard" className="font-medium text-ink hover:text-brand-600">
              {user.firstName || 'Dashboard'}
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-gray-300 px-4 py-2 font-medium text-ink hover:bg-peach-50"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm sm:gap-4">
            <Link to="/login" className="px-2 py-2 font-medium text-ink hover:text-brand-600">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 sm:px-5"
            >
              Register free
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
