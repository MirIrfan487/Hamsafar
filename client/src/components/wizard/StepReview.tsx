import { useEffect, useState, type ReactNode } from 'react'
import { photosApi, type MyPhoto } from '../../services/photos'
import type { MyProfile } from '../../services/profile'
import {
  COUNT_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PHOTO_PRIVACY_OPTIONS,
  PROFILE_FOR_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SECT_OPTIONS,
  heightLabel,
  labelFor,
} from '../../utils/options'
import { stepForMissingField, type PreferenceFormValues, type ProfileFormValues } from '../../utils/profileForm'

interface StepReviewProps {
  profile: MyProfile // last saved version from the API (status + missing fields)
  values: ProfileFormValues
  prefs: PreferenceFormValues
  goTo: (step: number) => void
}

function Section({ title, step, goTo, children }: { title: string; step: number; goTo: (s: number) => void; children: ReactNode }) {
  return (
    <section className="border-b border-peach-100 py-5 first:pt-0 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-ink">{title}</h3>
        <button type="button" onClick={() => goTo(step)} className="text-sm font-medium text-brand-600 hover:underline">
          Edit
        </button>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-ink-soft">{label}</dt>
      <dd className={value ? 'text-ink' : 'text-gray-400'}>{value || 'Not added'}</dd>
    </div>
  )
}

const listOrAny = (items: string[], options: { value: string; label: string }[]) =>
  items.length === 0 ? 'Any' : items.map((i) => labelFor(options, i)).join(', ')

function photoSummary(photos: MyPhoto[] | null): string {
  if (photos === null) return 'Loading…'
  if (photos.length === 0) return ''
  const waiting = photos.filter((ph) => ph.status === 'Pending').length
  return `${photos.length} photo(s)` + (waiting > 0 ? `, ${waiting} waiting for approval` : '')
}

export default function StepReview({ profile, values: v, prefs: p, goTo }: StepReviewProps) {
  const [photos, setPhotos] = useState<MyPhoto[] | null>(null)
  useEffect(() => {
    photosApi.list().then(setPhotos).catch(() => setPhotos([]))
  }, [])

  return (
    <div>
      {profile.missingFields.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Before you can submit, please complete:</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {profile.missingFields.map((f) => (
              <li key={f} className="flex items-center justify-between gap-4">
                <span>{f}</span>
                <button type="button" onClick={() => goTo(stepForMissingField(f))} className="font-medium text-brand-700 hover:underline">
                  Fix
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section title="Basic details" step={1} goTo={goTo}>
        <Row label="Profile for" value={labelFor(PROFILE_FOR_OPTIONS, v.profileFor)} />
        <Row label="Name" value={[v.firstName, v.lastName].filter(Boolean).join(' ')} />
        <Row label="Last name shown" value={v.showLastName ? 'Yes' : 'No'} />
        <Row label="Gender" value={v.gender} />
        <Row label="Date of birth" value={v.dateOfBirth} />
        <Row label="Marital status" value={labelFor(MARITAL_STATUS_OPTIONS, v.maritalStatus)} />
        <Row label="Height" value={heightLabel(v.heightCm)} />
      </Section>

      <Section title="Location & work" step={2} goTo={goTo}>
        <Row label="City" value={[v.city, v.state, v.country].filter(Boolean).join(', ')} />
        <Row label="Education" value={v.education} />
        <Row label="Occupation" value={v.occupation} />
      </Section>

      <Section title="Religion & about" step={3} goTo={goTo}>
        <Row label="Sect" value={labelFor(SECT_OPTIONS, v.sect)} />
        <Row label="Religious practice" value={labelFor(RELIGIOSITY_OPTIONS, v.religiosity)} />
        <Row label="Mother tongue" value={v.motherTongue} />
        <Row label="Photos visible to" value={labelFor(PHOTO_PRIVACY_OPTIONS, v.photoPrivacy)} />
        <div className="sm:col-span-2">
          <dt className="text-ink-soft">About</dt>
          <dd className={`mt-1 whitespace-pre-line ${v.aboutMe ? 'text-ink' : 'text-gray-400'}`}>{v.aboutMe || 'Not added'}</dd>
        </div>
      </Section>

      <Section title="Family" step={4} goTo={goTo}>
        <Row label="Father" value={v.fatherOccupation} />
        <Row label="Mother" value={v.motherOccupation} />
        <Row label="Brothers" value={labelFor(COUNT_OPTIONS, v.brothers)} />
        <Row label="Sisters" value={labelFor(COUNT_OPTIONS, v.sisters)} />
        <Row label="Family details" value={v.familyDetails} />
      </Section>

      <Section title="Photos" step={6} goTo={goTo}>
        <Row label="Photos" value={photoSummary(photos)} />
      </Section>

      <Section title="Partner preferences" step={5} goTo={goTo}>
        <Row label="Age" value={`${p.ageMin} to ${p.ageMax}`} />
        <Row label="Height" value={p.heightMinCm || p.heightMaxCm ? `${heightLabel(p.heightMinCm) || 'Any'} to ${heightLabel(p.heightMaxCm) || 'Any'}` : 'Any'} />
        <Row label="Marital status" value={listOrAny(p.maritalStatuses, MARITAL_STATUS_OPTIONS)} />
        <Row label="Sect" value={listOrAny(p.sects, SECT_OPTIONS)} />
        <Row label="Cities" value={p.cities || 'Any'} />
        <Row label="Education" value={p.education} />
        <Row label="Notes" value={p.notes} />
      </Section>
    </div>
  )
}
