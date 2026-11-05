import type { ReactNode } from 'react'
import Logo from '../components/Logo'
import { Bloom, Sprig } from '../components/Decor'
import { DEVELOPER, MARRIAGE_VERSE } from '../utils/verse'

// Layout for Login/Register: a message panel (left on big screens, top on phones) and the form card
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Message panel ---------- */}
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden bg-linear-to-br from-brand-800 via-brand-600 to-dusk px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
        <Bloom className="pointer-events-none absolute -right-6 -top-6 w-40 opacity-15" petal="#ffffff" center="#ffffff" />
        <Bloom className="pointer-events-none absolute -bottom-10 left-10 hidden w-56 opacity-10 lg:block" petal="#ffffff" center="#ffffff" />

        <Logo light />

        <div className="relative max-w-lg">
          <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-[2.1] text-white sm:text-3xl">
            {MARRIAGE_VERSE.arabic}
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">“{MARRIAGE_VERSE.english}”</p>
          <p className="mt-2 text-sm font-medium text-white/60">{MARRIAGE_VERSE.reference}</p>

          <p className="mt-8 hidden max-w-md text-sm leading-relaxed text-white/80 lg:block">
            A respectful place for Muslim individuals and families to find a spouse who shares their deen, with
            reviewed profiles, private photos and conversations that begin only when both sides agree.
          </p>
        </div>

        <div className="relative flex items-center gap-3 border-t border-white/15 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold" aria-hidden="true">
            {DEVELOPER.initials}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Designed and built by {DEVELOPER.name}</p>
            <p className="text-xs text-white/60">Sole developer of this platform</p>
          </div>
        </div>
      </aside>

      {/* ---------- Form ---------- */}
      <main className="relative flex items-center justify-center overflow-hidden bg-peach-100 px-4 py-10">
        <Sprig className="pointer-events-none absolute -right-8 top-8 hidden w-44 opacity-70 sm:block" flip />

        <div className="relative w-full max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(91,22,217,0.18)] sm:p-8">
            <h1 className="text-xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
