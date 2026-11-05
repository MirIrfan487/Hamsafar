import { Link } from 'react-router'
import SecurePhoto from './SecurePhoto'
import type { ProfileCard as ProfileCardData } from '../services/search'
import { MARITAL_STATUS_OPTIONS, RELIGIOSITY_OPTIONS, SECT_OPTIONS, heightLabel, labelFor } from '../utils/options'

// When there is no photo to show: initials, plus a short reason
export function PhotoPlaceholder({ name, locked, className = '' }: { name: string; locked: boolean; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-linear-to-br from-peach-100 to-brand-50 text-center ${className}`}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-brand-700">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="flex items-center gap-1 px-3 text-xs text-ink-soft">
        {locked && (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="4" y="9" width="12" height="8" rx="2" />
            <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
          </svg>
        )}
        {locked ? 'Photo shown after interest is accepted' : 'No photo'}
      </span>
    </div>
  )
}

export default function ProfileCard({ profile: p }: { profile: ProfileCardData }) {
  const tags = [
    labelFor(MARITAL_STATUS_OPTIONS, p.maritalStatus),
    labelFor(SECT_OPTIONS, p.sect),
    labelFor(RELIGIOSITY_OPTIONS, p.religiosity),
  ].filter(Boolean)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-peach-200">
      {p.photoId ? (
        <SecurePhoto photoId={p.photoId} alt={`Photo of ${p.displayName}`} className="aspect-[4/5] w-full object-cover" />
      ) : (
        <PhotoPlaceholder name={p.displayName} locked={p.photoLocked} className="aspect-[4/5] w-full" />
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-ink">
          {p.displayName}, {p.age}
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {[p.city, p.heightCm ? heightLabel(String(p.heightCm)) : ''].filter(Boolean).join(', ')}
        </p>
        {(p.education || p.occupation) && (
          <p className="mt-2 text-sm text-ink">{[p.occupation, p.education].filter(Boolean).join(', ')}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-peach-50 px-2.5 py-0.5 text-xs text-ink-soft ring-1 ring-peach-200">
              {t}
            </span>
          ))}
        </div>
        <Link
          to={`/profiles/${p.id}`}
          className="mt-4 inline-block self-start rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          View profile
        </Link>
      </div>
    </article>
  )
}
