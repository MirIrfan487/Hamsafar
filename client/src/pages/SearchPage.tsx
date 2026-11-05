import { useEffect, useState, type FormEvent } from 'react'
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
    window.scrollTo({ top: 0 })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    apply({ ...draft, page: 1 })
  }

  const update = (patch: Partial<SearchFilters>) => setDraft((prev) => ({ ...prev, ...patch }))
  const current = filtersFromParams(searchParams)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Search profiles</h1>
          {result && (
            <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
              {result.totalCount === 1 ? '1 profile found' : `${result.totalCount} profiles found`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-ink lg:hidden"
            aria-expanded={showFilters}
          >
            {showFilters ? 'Hide filters' : 'Filters'}
          </button>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Sort
            <select
              value={current.sort}
              onChange={(e) => apply({ ...current, sort: e.target.value as SearchSort, page: 1 })}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-ink"
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

      {me && me.status !== 'Approved' && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Your own profile is not visible to others yet.{' '}
          <Link to="/dashboard" className="font-semibold text-brand-700 hover:underline">
            See your profile status
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* ---------- Filters ---------- */}
        <form
          onSubmit={handleSubmit}
          className={`${showFilters ? 'block' : 'hidden'} h-fit space-y-5 rounded-2xl bg-white p-5 ring-1 ring-peach-200 lg:block`}
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
            <div className="rounded-2xl bg-peach-50 p-8 text-center ring-1 ring-peach-200">
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
  )
}
