import type { ReactNode } from 'react'
import { Link } from 'react-router'

// Layout for Login/Register: a centered card
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-rose-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-2xl font-semibold text-rose-700">
          Matrimony
        </Link>
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
