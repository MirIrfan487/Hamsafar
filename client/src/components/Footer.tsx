import { Link } from 'react-router'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="bg-dusk text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-3 max-w-xs text-sm">A safe matrimonial platform for Muslim individuals and families.</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="/#why" className="hover:text-white">Why us</a></li>
            <li><a href="/#features" className="hover:text-white">Features</a></li>
            <li><a href="/#how-it-works" className="hover:text-white">How it works</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Account</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/register" className="hover:text-white">Register free</Link></li>
            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60">© {new Date().getFullYear()} Matrimony</p>
      </div>
    </footer>
  )
}
