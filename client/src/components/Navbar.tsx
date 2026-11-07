import { Link, useNavigate } from 'react-router'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { isAdminOnly } from '../services/auth'

// Section links point to anchors on the home page (works from any page)
const SECTION_LINKS = [
  { href: '/#why', label: 'Why us' },
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#faq', label: 'Questions' },
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
    <header className="on-dark border-b border-white/10 bg-brand-900">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Logo light />

        <ul className="hidden items-center gap-7 text-sm font-medium text-white/75 md:flex">
          {SECTION_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-gold">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {user ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:gap-x-4">
            {user.roles.includes('Admin') && (
              <Link to="/admin" className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700 hover:bg-brand-100">
                Admin
              </Link>
            )}
            {!isAdminOnly(user) && (
              <>
              <Link to="/search" className="font-medium text-white/90 hover:text-gold">
                Search
              </Link>
              <Link to="/interests" className="font-medium text-white/90 hover:text-gold">
                Interests
              </Link>
              <Link to="/chat" className="flex items-center gap-1 font-medium text-white/90 hover:text-gold">
                Messages
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent-500 px-1.5 text-xs font-semibold text-brand-900" aria-label={`${unreadCount} unread`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" className="font-medium text-white/90 hover:text-gold">
                {user.firstName || 'Dashboard'}
              </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="whitespace-nowrap rounded-full border border-white/30 px-3 py-2 font-medium text-white hover:bg-white/10 sm:px-4"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
            <Link to="/login" className="whitespace-nowrap rounded-full border border-white/30 px-3 py-2 font-medium text-white hover:bg-white/10 sm:px-4">
              Log in
            </Link>
            <Link
              to="/register"
              className="whitespace-nowrap rounded-full bg-brand-600 px-3 py-2 font-semibold text-gold ring-1 ring-gold/40 hover:bg-brand-500 sm:px-5"
            >
              Register free
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
