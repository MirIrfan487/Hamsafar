import type { ReactNode } from 'react'
import Logo from '../components/Logo'
import { Bloom, Sprig } from '../components/Decor'

// Layout for Login/Register: a centered card on the peach background
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-peach-100 px-4 py-10">
      <Sprig className="pointer-events-none absolute -left-6 top-10 hidden w-48 opacity-80 sm:block" />
      <Bloom className="pointer-events-none absolute bottom-10 right-10 hidden w-10 sm:block" petal="var(--color-brand-400)" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(91,22,217,0.18)] sm:p-8">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
