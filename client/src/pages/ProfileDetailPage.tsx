import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import SecurePhoto from '../components/SecurePhoto'
import { PhotoPlaceholder } from '../components/ProfileCard'
import InterestActions from '../components/InterestActions'
import SafetyActions from '../components/SafetyActions'
import { ApiError } from '../services/api'
import { searchApi, type ProfileDetail } from '../services/search'
import {
  CREATED_BY_LABELS,
  MARITAL_STATUS_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SECT_OPTIONS,
  STATUS_LABELS,
  heightLabel,
  labelFor,
} from '../utils/options'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-peach-200 sm:p-6">
      <h2 className="font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

// Rows with no value are left out, so the page never shows "null"
function Details({ rows }: { rows: [string, string | null | undefined][] }) {
  const shown = rows.filter(([, v]) => v)
  if (shown.length === 0) return <p className="text-sm text-gray-400">Not added</p>
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {shown.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt className="w-32 shrink-0 text-ink-soft">{label}</dt>
          <dd className="text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const list = (items: string[], options: { value: string; label: string }[]) =>
  items.length === 0 ? 'Any' : items.map((i) => labelFor(options, i)).join(', ')

// /profiles/:id — another member's full profile
export default function ProfileDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileDetail | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [activePhoto, setActivePhoto] = useState(0)

  const load = () =>
    searchApi
      .getProfile(Number(id))
      .then(setProfile)
      .catch((err) => setErrors(err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']))

  useEffect(() => {
    setProfile(null)
    setErrors([])
    setActivePhoto(0)
    load()
  }, [id]) // load again when the id in the URL changes

  if (errors.length > 0)
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <ErrorAlert messages={errors} />
        <Link to="/search" className="text-sm font-medium text-brand-600 hover:underline">
          Back to search
        </Link>
      </div>
    )
  if (!profile) return <p className="p-10 text-center text-ink-soft">Loading profile…</p>

  const p = profile
  const pp = p.partnerPreference
  const mainPhotoId = p.photoIds[activePhoto]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button type="button" onClick={() => navigate(-1)} className="text-sm font-medium text-brand-600 hover:underline">
        Back
      </button>

      {p.isOwnProfile && (
        <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          This is how other members see your profile. Status: {STATUS_LABELS[p.status]}.{' '}
          <Link to="/profile/edit" className="font-semibold hover:underline">
            Edit profile
          </Link>
        </p>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-[320px_1fr]">
        {/* ---------- Photos ---------- */}
        <div>
          {mainPhotoId ? (
            <SecurePhoto photoId={mainPhotoId} alt={`Photo of ${p.displayName}`} className="aspect-[4/5] w-full rounded-2xl object-cover" />
          ) : (
            <PhotoPlaceholder name={p.displayName} locked={p.photosLocked} className="aspect-[4/5] w-full rounded-2xl" />
          )}
          {p.photoIds.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {p.photoIds.map((photoId, i) => (
                <button
                  key={photoId}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-pressed={i === activePhoto}
                  className={`overflow-hidden rounded-lg ring-2 ${i === activePhoto ? 'ring-brand-600' : 'ring-transparent'}`}
                >
                  <SecurePhoto photoId={photoId} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Details ---------- */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              {p.displayName}, {p.age}
            </h1>
            <p className="mt-1 text-ink-soft">{[p.city, p.state, p.country].filter(Boolean).join(', ')}</p>
            <p className="mt-1 text-sm text-ink-soft">{CREATED_BY_LABELS[p.profileFor]}</p>
          </div>

          {!p.isOwnProfile && <InterestActions profile={p} onChanged={load} />}

          {p.aboutMe && (
            <Section title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{p.aboutMe}</p>
            </Section>
          )}

          <Section title="Basic details">
            <Details
              rows={[
                ['Marital status', labelFor(MARITAL_STATUS_OPTIONS, p.maritalStatus)],
                ['Height', p.heightCm ? heightLabel(String(p.heightCm)) : null],
                ['Mother tongue', p.motherTongue],
                ['Education', p.education],
                ['Occupation', p.occupation],
              ]}
            />
          </Section>

          <Section title="Religion">
            <Details
              rows={[
                ['Sect', labelFor(SECT_OPTIONS, p.sect)],
                ['Religious practice', labelFor(RELIGIOSITY_OPTIONS, p.religiosity)],
              ]}
            />
          </Section>

          <Section title="Family">
            <Details
              rows={[
                ["Father", p.fatherOccupation],
                ["Mother", p.motherOccupation],
                ['Brothers', p.brothers == null ? null : String(p.brothers)],
                ['Sisters', p.sisters == null ? null : String(p.sisters)],
              ]}
            />
            {p.familyDetails && <p className="mt-3 whitespace-pre-line text-sm text-ink">{p.familyDetails}</p>}
          </Section>

          {pp && (
            <Section title="Looking for">
              <Details
                rows={[
                  ['Age', `${pp.ageMin} to ${pp.ageMax}`],
                  [
                    'Height',
                    pp.heightMinCm || pp.heightMaxCm
                      ? `${pp.heightMinCm ? heightLabel(String(pp.heightMinCm)) : 'Any'} to ${pp.heightMaxCm ? heightLabel(String(pp.heightMaxCm)) : 'Any'}`
                      : 'Any',
                  ],
                  ['Marital status', list(pp.maritalStatuses, MARITAL_STATUS_OPTIONS)],
                  ['Sect', list(pp.sects, SECT_OPTIONS)],
                  ['Cities', pp.cities.length ? pp.cities.join(', ') : 'Any'],
                  ['Education', pp.education],
                ]}
              />
              {pp.notes && <p className="mt-3 whitespace-pre-line text-sm text-ink">{pp.notes}</p>}
            </Section>
          )}

          {!p.isOwnProfile && <SafetyActions profileId={p.id} name={p.displayName} />}
        </div>
      </div>
    </div>
  )
}
