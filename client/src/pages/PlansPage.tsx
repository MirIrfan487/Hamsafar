import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'
import { formatRupees, paymentsApi, type MySubscription, type Plan } from '../services/payments'
import { UPI_FIRST, loadRazorpay, openCheckout } from '../utils/razorpay'

const FREE_FEATURES = ['Create a profile', 'Search profiles', 'Send and receive interests']

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })

function Check() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-brand-900">
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="m5 10.5 3.2 3L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// /plans
export default function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [mine, setMine] = useState<MySubscription | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    paymentsApi.plans().then(setPlans).catch((err) => setErrors(errorMessages(err)))
    if (user) paymentsApi.mine().then(setMine).catch(() => {})
  }, [user])

  const buy = async (plan: Plan) => {
    setErrors([])
    setSuccess(false)
    setBusy(true)
    try {
      // 1) Our server creates the order (it decides the price, not the browser)
      const order = await paymentsApi.createOrder(plan.code)
      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your internet connection.')

      // 2) Razorpay's own payment window
      openCheckout(
        {
          key: order.keyId,
          amount: order.amountInPaise,
          currency: order.currency,
          order_id: order.orderId,
          name: 'Hamsafar',
          description: order.planName,
          prefill: { name: order.prefillName, email: order.prefillEmail },
          theme: { color: '#0e1d36' },
          config: UPI_FIRST, // UPI shown first in the payment window
          // 3) Our server checks the payment with Razorpay before activating Premium
          handler: (response) => {
            paymentsApi
              .verify(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature)
              .then((updated) => {
                setMine(updated)
                setSuccess(true)
              })
              .catch((err) => setErrors(errorMessages(err)))
              .finally(() => setBusy(false))
          },
          modal: { ondismiss: () => setBusy(false) },
        },
        (message) => setErrors([`Payment failed: ${message}`]),
      )
    } catch (err) {
      setErrors(err instanceof Error && !(err instanceof ApiError) ? [err.message] : errorMessages(err))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Plans</h1>
      <p className="mt-2 text-ink-soft">
        Registering, searching and sending interests are free. To chat, both members need Premium.
      </p>

      {mine?.isPremium && mine.premiumUntilUtc && (
        <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900 ring-1 ring-green-200">
          You have <span className="font-semibold">{mine.planName}</span> until{' '}
          <span className="font-semibold">{formatDate(mine.premiumUntilUtc)}</span>. Buying again adds more time after that date.
        </p>
      )}
      {success && (
        <p role="status" className="mt-4 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          Payment received. Premium is active.{' '}
          <Link to="/chat" className="font-semibold hover:underline">
            Go to messages
          </Link>
        </p>
      )}
      <div className="mt-4">
        <ErrorAlert messages={errors} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-peach-200">
          <h2 className="text-lg font-semibold text-ink">Free</h2>
          <p className="mt-1 text-3xl font-bold text-ink">₹0</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {plans === null && errors.length === 0 && <p className="text-ink-soft">Loading plans…</p>}

        {plans?.map((plan) => (
          <section key={plan.code} className="rounded-2xl bg-brand-600 p-6 text-white shadow-[0_24px_60px_-24px_rgba(14,29,54,0.55)]">
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 text-3xl font-bold">
              {formatRupees(plan.priceInPaise)}
              <span className="ml-1 text-base font-normal text-white/80">for {plan.durationDays} days</span>
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex gap-2.5">
                <Check />
                Everything in Free
              </li>
              {plan.canChat && (
                <li className="flex gap-2.5">
                  <Check />
                  Read and send messages with connected members who also have Premium
                </li>
              )}
              {plan.canViewContactDetails && (
                <li className="flex gap-2.5">
                  <Check />
                  See contact details of connected members
                </li>
              )}
              <li className="flex gap-2.5">
                <Check />
                No automatic renewal: you pay only when you choose to
              </li>
            </ul>
            {user ? (
              <button
                type="button"
                onClick={() => buy(plan)}
                disabled={busy}
                className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
              >
                {busy ? 'Opening payment…' : mine?.isPremium ? `Add ${plan.durationDays} more days` : `Upgrade for ${formatRupees(plan.priceInPaise)}`}
              </button>
            ) : (
              <Link
                to="/login"
                state={{ from: '/plans' }}
                className="mt-6 block w-full rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Log in to upgrade
              </Link>
            )}
            <p className="mt-3 text-center text-xs text-white/70">Pay with UPI (Google Pay, PhonePe, Paytm), cards or net banking. Secured by Razorpay.</p>
          </section>
        ))}
      </div>

      {mine && mine.payments.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold text-ink">Payment history</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-peach-200">
            <table className="w-full bg-white text-left text-sm">
              <thead className="bg-peach-50 text-ink-soft">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.payments.map((p) => (
                  <tr key={p.id} className="border-t border-peach-100">
                    <td className="px-4 py-2">{formatDate(p.paidAtUtc ?? p.createdAtUtc)}</td>
                    <td className="px-4 py-2">{p.planName}</td>
                    <td className="px-4 py-2">{formatRupees(p.amountInPaise)}</td>
                    <td className="px-4 py-2">{p.status === 'Paid' ? 'Paid' : 'Failed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
