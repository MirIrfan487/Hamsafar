import { NavLink, Outlet } from 'react-router'

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/profiles', label: 'Profiles' },
  { to: '/admin/photos', label: 'Photos' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/members', label: 'Members' },
  { to: '/admin/activity', label: 'Activity' },
]

// Frame for every admin page: a title and the tab bar
export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">Admin panel</h1>
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-peach-200" aria-label="Admin sections">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
                isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-soft hover:text-ink'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}

// Shared helpers for admin pages
export const errorText = (err: unknown) =>
  err && typeof err === 'object' && 'messages' in err ? (err as { messages: string[] }).messages : ['Could not reach the server. Is the API running?']

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
