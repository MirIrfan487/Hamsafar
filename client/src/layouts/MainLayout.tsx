import { Outlet } from 'react-router'
import Navbar from '../components/Navbar'

// Layout for normal pages: navbar on top, page content below
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-rose-50/40">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
