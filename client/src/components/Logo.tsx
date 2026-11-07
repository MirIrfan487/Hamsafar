import { Link } from 'react-router'

// Two linked rings + the name. The brand name is also in index.html, Footer.tsx and PlansPage.tsx (Razorpay checkout).
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Hamsafar home">
      <svg viewBox="0 0 36 24" className="h-6 w-9" aria-hidden="true">
        <circle cx="13" cy="12" r="8.5" fill="none" stroke={light ? '#fff' : 'var(--color-brand-600)'} strokeWidth="3" />
        <circle cx="23" cy="12" r="8.5" fill="none" stroke="var(--color-accent-500)" strokeWidth="3" />
      </svg>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>Hamsafar</span>
    </Link>
  )
}
