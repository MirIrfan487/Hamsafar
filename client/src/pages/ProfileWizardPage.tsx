import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import WizardProgress from '../components/wizard/WizardProgress'
import StepBasic from '../components/wizard/StepBasic'
import StepLocationWork from '../components/wizard/StepLocationWork'
import StepReligionAbout from '../components/wizard/StepReligionAbout'
import StepFamily from '../components/wizard/StepFamily'
import StepPreferences from '../components/wizard/StepPreferences'
import StepPhotos from '../components/wizard/StepPhotos'
import StepReview from '../components/wizard/StepReview'
import { ApiError } from '../services/api'
import { profileApi, type MyProfile } from '../services/profile'
import { STATUS_LABELS } from '../utils/options'
import { maxBirthDateForAge } from '../utils/date'
import {
  toFormValues,
  toPreferenceRequest,
  toPreferenceValues,
  toProfileRequest,
  type PreferenceFormValues,
  type ProfileFormValues,
} from '../utils/profileForm'

const STEPS = ['Basic details', 'Location & work', 'Religion & about', 'Family', 'Partner preferences', 'Photos', 'Review & submit']
const LAST = STEPS.length
const PREFERENCES_STEP = 5
const PHOTOS_STEP = 6 // photos save on upload, so this step just moves on
const RELIGION_STEP = 3 // where the photo privacy setting lives
const MAX_DOB = maxBirthDateForAge(18)

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

// /profile/edit?step=1..7 — the step is in the URL so a page refresh keeps your place
export default function ProfileWizardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const step = Math.min(Math.max(Number(searchParams.get('step')) || 1, 1), LAST)

  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [values, setValues] = useState<ProfileFormValues | null>(null)
  const [prefs, setPrefs] = useState<PreferenceFormValues | null>(null)
  const [loadError, setLoadError] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    profileApi
      .getMine()
      .then((p) => {
        setProfile(p)
        setValues(toFormValues(p))
        setPrefs(toPreferenceValues(p))
      })
      .catch((err) => setLoadError(errorMessages(err)))
  }, [])

  const goTo = (n: number) => {
    setErrors([])
    setSearchParams({ step: String(n) })
    window.scrollTo({ top: 0 })
  }

  // Quick checks before saving. The API checks everything again.
  const validateStep = (): string[] => {
    if (!values || !prefs) return []
    const problems: string[] = []
    if (step === 1) {
      if (!values.firstName.trim()) problems.push('Please enter the first name.')
      if (!values.dateOfBirth) problems.push('Please enter the date of birth.')
      else if (values.dateOfBirth > MAX_DOB) problems.push('The person must be at least 18 years old.')
    }
    if (step === PREFERENCES_STEP) {
      if (Number(prefs.ageMax) < Number(prefs.ageMin)) problems.push('"Age to" must be the same as or more than "Age from".')
      if (prefs.heightMinCm && prefs.heightMaxCm && Number(prefs.heightMaxCm) < Number(prefs.heightMinCm))
        problems.push('"Height to" must be the same as or more than "Height from".')
    }
    return problems
  }

  // Save this step, then move on
  const saveAndContinue = async () => {
    if (!values || !prefs) return
    if (step === PHOTOS_STEP) return goTo(step + 1)
    const problems = validateStep()
    setErrors(problems)
    if (problems.length > 0) return

    setSaving(true)
    try {
      const updated =
        step === PREFERENCES_STEP
          ? await profileApi.updatePreferences(toPreferenceRequest(prefs))
          : await profileApi.update(toProfileRequest(values))
      setProfile(updated)
      goTo(step + 1)
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    setErrors([])
    setSaving(true)
    try {
      setProfile(await profileApi.submit())
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setSaving(false)
    }
  }

  if (loadError.length > 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorAlert messages={loadError} />
      </div>
    )
  if (!profile || !values || !prefs) return <p className="p-10 text-center text-ink-soft">Loading your profile…</p>

  const updateValues = (patch: Partial<ProfileFormValues>) => setValues((prev) => (prev ? { ...prev, ...patch } : prev))
  const updatePrefs = (patch: Partial<PreferenceFormValues>) => setPrefs((prev) => (prev ? { ...prev, ...patch } : prev))

  const isPending = profile.status === 'PendingApproval'
  const canSubmit = profile.missingFields.length === 0 && (profile.status === 'Draft' || profile.status === 'Rejected')

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Your profile</h1>
        <span className="rounded-full bg-peach-100 px-3 py-1 text-xs font-semibold text-ink">{STATUS_LABELS[profile.status]}</span>
      </div>

      {profile.status === 'Approved' && (
        <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          Your profile is live. If you save changes, our team will review it again before it shows in search.
        </p>
      )}
      {profile.status === 'Rejected' && profile.rejectionReason && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Our team asked for changes: {profile.rejectionReason}
        </p>
      )}

      <div className="mt-6">
        <WizardProgress steps={STEPS} current={step} onSelect={goTo} />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-peach-200 sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-ink">{STEPS[step - 1]}</h2>

        {errors.length > 0 && (
          <div className="mb-5">
            <ErrorAlert messages={errors} />
          </div>
        )}

        {step === 1 && <StepBasic values={values} update={updateValues} />}
        {step === 2 && <StepLocationWork values={values} update={updateValues} />}
        {step === 3 && <StepReligionAbout values={values} update={updateValues} />}
        {step === 4 && <StepFamily values={values} update={updateValues} />}
        {step === 5 && <StepPreferences values={prefs} update={updatePrefs} />}
        {step === PHOTOS_STEP && <StepPhotos photoPrivacy={values.photoPrivacy} onChangePrivacy={() => goTo(RELIGION_STEP)} />}
        {step === LAST && <StepReview profile={profile} values={values} prefs={prefs} goTo={goTo} />}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-peach-100 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={saving}
              className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-60"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {step < LAST ? (
            <button
              type="button"
              onClick={saveAndContinue}
              disabled={saving}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : step === PHOTOS_STEP ? 'Continue' : 'Save and continue'}
            </button>
          ) : isPending ? (
            <Link to="/dashboard" className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Go to dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving || !canSubmit}
              className="rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Submitting…' : 'Submit for approval'}
            </button>
          )}
        </div>

        {step === LAST && isPending && (
          <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
            Your profile has been sent for approval. We will review it and it will appear in search once approved.
          </p>
        )}
      </div>
    </div>
  )
}
