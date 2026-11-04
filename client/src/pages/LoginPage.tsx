import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import AuthLayout from '../layouts/AuthLayout'
import FormField from '../components/FormField'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // If ProtectedRoute sent us here, go back to that page after login
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?'])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert messages={errors} />

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-gray-600">
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Create a free account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
