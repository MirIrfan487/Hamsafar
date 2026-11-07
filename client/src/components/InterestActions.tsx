import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import ErrorAlert from './ErrorAlert'
import { ApiError } from '../services/api'
import { interestsApi } from '../services/interests'
import { paymentsApi, type ContactDetails } from '../services/payments'
import type { ProfileDetail } from '../services/search'

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

// The interest box on another member's profile page. Shows the right action for the current state.
export default function InterestActions({ profile, onChanged }: { profile: ProfileDetail; onChanged: () => void }) {
  const [note, setNote] = useState('')
  const [writing, setWriting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [contact, setContact] = useState<ContactDetails | null>(null)
  const [needsPremium, setNeedsPremium] = useState(false)

  const showContact = async () => {
    setErrors([])
    setBusy(true)
    try {
      setContact(await paymentsApi.contact(profile.id))
    } catch (err) {
      setErrors(errorMessages(err))
      setNeedsPremium(err instanceof ApiError && err.status === 403)
    } finally {
      setBusy(false)
    }
  }

  const run = async (action: () => Promise<unknown>) => {
    setErrors([])
    setBusy(true)
    try {
      await action()
      setWriting(false)
      setNote('')
      onChanged() // reload the profile: status and photos may have changed
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setBusy(false)
    }
  }

  const i = profile.interest
  const name = profile.displayName
  const primary = 'rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-60'
  const secondary = 'rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-60'

  let content: ReactNode
  if (i?.status === 'Accepted') {
    content = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-green-800">You are connected with {name}.</p>
          <div className="flex flex-wrap gap-2">
            <Link to={`/chat?with=${profile.id}`} className={primary}>
              Send a message
            </Link>
            {!contact && (
              <button type="button" disabled={busy} onClick={showContact} className={secondary}>
                Show contact details
              </button>
            )}
          </div>
        </div>
        {contact && (
          <dl className="grid gap-1 rounded-xl bg-white p-3 text-sm ring-1 ring-peach-200 sm:grid-cols-2">
            <div>
              <dt className="text-ink-soft">Email</dt>
              <dd className="text-ink">{contact.email ?? 'Not added'}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Phone</dt>
              <dd className="text-ink">{contact.phoneNumber ?? 'Not added'}</dd>
            </div>
          </dl>
        )}
        {needsPremium && (
          <Link to="/plans" className="inline-block text-sm font-semibold text-brand-700 hover:underline">
            See Premium plans
          </Link>
        )}
      </div>
    )
  } else if (i?.status === 'Pending' && i.direction === 'Received') {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-ink">
          <span className="font-semibold">{name} has sent you an interest.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => run(() => interestsApi.accept(i.id))} className={primary}>
            Accept
          </button>
          <button type="button" disabled={busy} onClick={() => run(() => interestsApi.reject(i.id))} className={secondary}>
            Decline
          </button>
        </div>
      </div>
    )
  } else if (i?.status === 'Pending' && i.direction === 'Sent') {
    content = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink">Interest sent. Waiting for {name} to reply.</p>
        <button type="button" disabled={busy} onClick={() => run(() => interestsApi.withdraw(i.id))} className={secondary}>
          Withdraw
        </button>
      </div>
    )
  } else if (i?.status === 'Rejected') {
    content = (
      <p className="text-sm text-ink-soft">
        {i.direction === 'Sent' ? `${name} is not interested at this time.` : 'You declined this interest.'}
      </p>
    )
  } else if (!profile.viewerIsApproved) {
    content = (
      <p className="text-sm text-ink-soft">
        You can send interests once your own profile is approved.{' '}
        <Link to="/dashboard" className="font-semibold text-brand-700 hover:underline">
          See your profile status
        </Link>
      </p>
    )
  } else if (writing) {
    content = (
      <div className="space-y-3">
        <label htmlFor="interest-note" className="block text-sm font-medium text-gray-700">
          Add a short message (optional)
        </label>
        <textarea
          id="interest-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="e.g. Assalamu alaikum. Our family would like to know more."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <p className="text-xs text-ink-soft">Please do not share phone numbers or emails here.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => run(() => interestsApi.send(profile.id, note))} className={primary}>
            {busy ? 'Sending…' : 'Send interest'}
          </button>
          <button type="button" disabled={busy} onClick={() => setWriting(false)} className={secondary}>
            Cancel
          </button>
        </div>
      </div>
    )
  } else {
    content = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">If {name} accepts, you can chat privately.</p>
        <button type="button" onClick={() => setWriting(true)} className={primary}>
          Send interest
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-peach-50 p-4 ring-1 ring-peach-200">
      {content}
      <ErrorAlert messages={errors} />
    </div>
  )
}
