import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import AuthLayout from '../layouts/AuthLayout'
import FormField from '../components/FormField'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'
import { authApi, type Gender, type ProfileFor } from '../services/auth'
import { maxBirthDateForAge } from '../utils/date'

const PROFILE_FOR_OPTIONS: { value: ProfileFor; label: string }[] = [
  { value: 'Self', label: 'Myself' },
  { value: 'Son', label: 'My son' },
  { value: 'Daughter', label: 'My daughter' },
  { value: 'Brother', label: 'My brother' },
  { value: 'Sister', label: 'My sister' },
  { value: 'Relative', label: 'A relative or friend' },
]

// For these choices the gender is already known
const GENDER_FOR: Partial<Record<ProfileFor, Gender>> = {
  Son: 'Male',
  Brother: 'Male',
  Daughter: 'Female',
  Sister: 'Female',
}

const MAX_DOB = maxBirthDateForAge(18) // date picker won't allow anyone under 18

export default function RegisterPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    profileFor: 'Self' as ProfileFor,
    firstName: '',
    gender: '' as Gender | '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const isSelf = form.profileFor === 'Self'
  const genderLocked = GENDER_FOR[form.profileFor] !== undefined

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      // Picking "My daughter" sets gender to Female automatically, etc.
      if (name === 'profileFor') next.gender = GENDER_FOR[value as ProfileFor] ?? prev.gender
      return next
    })
  }

  // Quick checks in the browser. The API checks everything again — never trust only the frontend.
  const validate = (): string[] => {
    const problems: string[] = []
    if (!form.gender) problems.push('Please select a gender.')
    if (!form.dateOfBirth) problems.push('Please enter the date of birth.')
    else if (form.dateOfBirth > MAX_DOB) problems.push('The person must be at least 18 years old.')
    if (form.password.length < 8 || !/\d/.test(form.password))
      problems.push('Password must be at least 8 characters and include a number.')
    if (form.password !== form.confirmPassword) problems.push('Passwords do not match.')
    return problems
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const problems = validate()
    setErrors(problems)
    if (problems.length > 0) return

    setSubmitting(true)
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        profileFor: form.profileFor,
        gender: form.gender as Gender,
        dateOfBirth: form.dateOfBirth,
      })
      // Account created -> log in straight away
      await login(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?'])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Registration is free.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorAlert messages={errors} />

        <div>
          <label htmlFor="profileFor" className="block text-sm font-medium text-gray-700">
            This profile is for
          </label>
          <select
            id="profileFor"
            name="profileFor"
            value={form.profileFor}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            {PROFILE_FOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <FormField
          label={isSelf ? 'Your first name' : 'Their first name'}
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          maxLength={50}
          required
        />

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">Gender</legend>
          <div className="mt-1 flex gap-6">
            {(['Male', 'Female'] as Gender[]).map((g) => (
              <label key={g} className="flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={handleChange}
                  disabled={genderLocked}
                  className="accent-rose-600"
                />
                {g}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField
          label={isSelf ? 'Your date of birth' : 'Their date of birth'}
          name="dateOfBirth"
          type="date"
          value={form.dateOfBirth}
          onChange={handleChange}
          max={MAX_DOB}
          hint="Must be 18 or older."
          required
        />

        <hr className="border-gray-100" />

        <FormField
          label="Email (for login)"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          hint="At least 8 characters, including a number."
          required
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-rose-600 py-2.5 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-rose-700 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
