import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import FormField from '../components/FormField'
import SelectField from '../components/SelectField'
import CheckboxGroup from '../components/CheckboxGroup'
import ProfileCard from '../components/ProfileCard'
import { ApiError } from '../services/api'
import { profileApi, type MyProfile } from '../services/profile'
import {
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  searchApi,
  type PagedResult,
  type ProfileCard as ProfileCardData,
  type SearchFilters,
  type SearchSort,
} from '../services/search'
import {
  AGE_OPTIONS,
  HEIGHT_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SECT_OPTIONS,
  SORT_OPTIONS,
} from '../utils/options'

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

// Starting filters from the member's own partner preferences
function filtersFromPreferences(me: MyProfile): SearchFilters {
  const pp = me.partnerPreference
  if (!pp) return EMPTY_FILTERS
  return {
    ...EMPTY_FILTERS,
    ageMin: String(pp.ageMin),
    ageMax: String(pp.ageMax),
    maritalStatuses: pp.maritalStatuses,
    sects: pp.sects,
  }
}

// /search — the filters live in the URL, e.g. /search?ageMin=24&ageMax=30&city=Srinagar
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [me, setMe] = useState<MyProfile | null>(null)
  const [ready, setReady] = useState(false) // true once the starting filters are decided
  const [draft, setDraft] = useState<SearchFilters>(() => filtersFromParams(searchParams)) // what the form shows
  const [result, setResult] = useState<PagedResult<ProfileCardData> | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false) // mobile only
  const resultsTop = useRef<HTMLDivElement>(null) // where to scroll after a new search

  // 1) Load my profile. If the URL has no filters, start from my partner preferences.
  useEffect(() => {
    profileApi
      .getMine()
      .then((p) => {
        setMe(p)
        if (searchParams.toString() === '') {
          const start = filtersFromPreferences(p)
          setDraft(start)
          setSearchParams(filtersToParams(start), { replace: true })
        }
      })
      .catch(() => {
        /* the search itself will show any error */
      })
      .finally(() => setReady(true))
  }, []) // run once on page load

  // 2) Search every time the URL filters change
  const query = searchParams.toString()
  useEffect(() => {
    if (!ready) return
    let cancelled = false // ignore an older answer that arrives after a newer search
    setDraft(filtersFromParams(new URLSearchParams(query)))
    setLoading(true)
    setErrors([])
    searchApi
      .search(new URLSearchParams(query))
      .then((r) => !cancelled && setResult(r))
      .catch((err) => !cancelled && setErrors(errorMessages(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query, ready])

  const apply = (filters: SearchFilters) => {
    setSearchParams(filtersToParams(filters))
    setShowFilters(false)
    resultsTop.current?.scrollIntoView() // skip past the hero, straight to the results
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    apply({ ...draft, page: 1 })
  }

  const update = (patch: Partial<SearchFilters>) => setDraft((prev) => ({ ...prev, ...patch }))
  const current = filtersFromParams(searchParams)

  return (
    <>
      {/* ---------- Hero (same look as the dashboard hero) ---------- */}
      <section className="on-dark relative overflow-hidden border-b border-gold/25 bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="pointer-events-none absolute -right-24 top-1/4 hidden h-96 w-96 rounded-full bg-gold/10 blur-3xl lg:block" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:py-12 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Find your match
              <span className="h-px w-10 bg-gold" aria-hidden="true" />
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Search <span className="italic text-gold">profiles</span>
            </h1>
            <p className="mt-4 max-w-lg leading-relaxed text-white/80">
              Filter by age, location, education and religious practice to find members who suit you.
            </p>
          </div>

          {/* Result count and sort, in the same framed panel as the dashboard */}
          <div className="relative rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] sm:p-6">
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-gold" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Your search</h2>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <p aria-live="polite">
                <span className="block font-display text-4xl font-bold lining-nums text-gold">{result?.totalCount ?? '–'}</span>
                <span className="mt-1 block text-xs leading-snug text-white/80">
                  {result?.totalCount === 1 ? 'profile found' : 'profiles found'}
                </span>
              </p>
              <label className="flex items-center gap-2 text-sm text-white/80">
                Sort
                <select
                  value={current.sort}
                  onChange={(e) => apply({ ...current, sort: e.target.value as SearchSort, page: 1 })}
                  className="rounded-lg border border-white/30 bg-white px-2 py-1.5 text-ink"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Filters and results ---------- */}
      <div ref={resultsTop} className="bg-peach-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          {me && me.status !== 'Approved' && (
            <p className="mb-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              Your own profile is not visible to others yet.{' '}
              <Link to="/dashboard" className="font-semibold text-brand-700 hover:underline">
                See your profile status
              </Link>
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="mb-6 rounded-full border border-brand-200 bg-white px-5 py-2 text-sm font-medium text-ink lg:hidden"
            aria-expanded={showFilters}
          >
            {showFilters ? 'Hide filters' : 'Filters'}
          </button>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* ---------- Filters ---------- */}
            <form
              onSubmit={handleSubmit}
              className={`${showFilters ? 'block' : 'hidden'} h-fit space-y-5 rounded-2xl border border-peach-200 bg-white p-5 lg:block`}
            >
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Age from" name="f-ageMin" value={draft.ageMin} onChange={(v) => update({ ageMin: v })} options={AGE_OPTIONS} placeholder="Any" />
                <SelectField label="Age to" name="f-ageMax" value={draft.ageMax} onChange={(v) => update({ ageMax: v })} options={AGE_OPTIONS} placeholder="Any" />
                <SelectField
                  label="Height from"
                  name="f-heightMin"
                  value={draft.heightMinCm}
                  onChange={(v) => update({ heightMinCm: v })}
                  options={HEIGHT_OPTIONS}
                  placeholder="Any"
                />
                <SelectField
                  label="Height to"
                  name="f-heightMax"
                  value={draft.heightMaxCm}
                  onChange={(v) => update({ heightMaxCm: v })}
                  options={HEIGHT_OPTIONS}
                  placeholder="Any"
                />
              </div>

              <FormField label="City or state" name="f-city" value={draft.city} onChange={(e) => update({ city: e.target.value })} placeholder="e.g. Srinagar" />
              <FormField
                label="Education"
                name="f-education"
                value={draft.education}
                onChange={(e) => update({ education: e.target.value })}
                placeholder="e.g. MBA"
              />

              <CheckboxGroup label="Marital status" options={MARITAL_STATUS_OPTIONS} values={draft.maritalStatuses} onChange={(v) => update({ maritalStatuses: v })} />
              <CheckboxGroup label="Sect" options={SECT_OPTIONS} values={draft.sects} onChange={(v) => update({ sects: v })} />
              <CheckboxGroup
                label="Religious practice"
                options={RELIGIOSITY_OPTIONS}
                values={draft.religiosities}
                onChange={(v) => update({ religiosities: v })}
              />

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={draft.withPhotoOnly}
                  onChange={(e) => update({ withPhotoOnly: e.target.checked })}
                  className="h-4 w-4 accent-brand-600"
                />
                Only profiles with a photo I can see
              </label>

              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                  Show results
                </button>
                <button
                  type="button"
                  onClick={() => apply({ ...EMPTY_FILTERS, sort: current.sort })}
                  className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-ink hover:bg-peach-50"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* ---------- Results ---------- */}
            <section aria-busy={loading}>
              <ErrorAlert messages={errors} />

              {!result && !errors.length && <p className="text-ink-soft">Searching…</p>}

              {result && result.items.length === 0 && (
                <div className="rounded-2xl border border-peach-200 bg-white p-8 text-center">
                  <p className="font-semibold text-ink">No profiles match these filters</p>
                  <p className="mt-1 text-sm text-ink-soft">Try a wider age range, or clear some filters.</p>
                  <button
                    type="button"
                    onClick={() => apply({ ...EMPTY_FILTERS, sort: current.sort })}
                    className="mt-4 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {result && result.items.length > 0 && (
                <>
                  <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                    {result.items.map((p) => (
                      <ProfileCard key={p.id} profile={p} />
                    ))}
                  </div>

                  {result.totalPages > 1 && (
                    <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="Pages">
                      <button
                        type="button"
                        disabled={result.page <= 1}
                        onClick={() => apply({ ...current, page: result.page - 1 })}
                        className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-ink hover:bg-peach-50 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-ink-soft">
                        Page {result.page} of {result.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={result.page >= result.totalPages}
                        onClick={() => apply({ ...current, page: result.page + 1 })}
                        className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-ink hover:bg-peach-50 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
