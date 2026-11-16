// Opens Razorpay's payment window.
//  - Website:     Razorpay's checkout.js script (loaded only when someone is about to pay).
//  - Android app: Razorpay's native Android SDK (capacitor-razorpay plugin). The website script does not work
//    well inside an app: bank (3-D Secure) pages open in pop-ups the app cannot keep, and UPI apps cannot open.
// Either way we only get the payment ids here. Premium is activated only after OUR SERVER verifies them.

import { Checkout } from 'capacitor-razorpay'
import { isNativeApp } from './nativeApp'

export interface RazorpaySuccess {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// What we pass to Razorpay (the same for website and app)
export interface PaymentOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill: { name: string; email: string }
  theme: { color: string }
  config?: CheckoutDisplayConfig
}

// Razorpay "display configuration": which payment methods to show, and in what order
export interface CheckoutDisplayConfig {
  display: {
    blocks: Record<string, { name: string; instruments: { method: string }[] }>
    sequence: string[]
    preferences: { show_default_blocks: boolean }
  }
}

// UPI first (Google Pay, PhonePe, Paytm, any UPI ID or QR), then Razorpay's other methods (cards, net banking)
export const UPI_FIRST: CheckoutDisplayConfig = {
  display: {
    blocks: {
      upi: { name: 'Pay with UPI', instruments: [{ method: 'upi' }] },
    },
    sequence: ['block.upi'],
    preferences: { show_default_blocks: true }, // set to false to allow ONLY UPI
  },
}

// Pays and returns the ids, or null if the member closed the window without paying.
// onFailedAttempt (website only): a try failed but the window stays open so they can try again.
// Throws an Error with a readable message if the payment cannot go ahead.
export function payWithRazorpay(
  options: PaymentOptions,
  onFailedAttempt: (message: string) => void,
): Promise<RazorpaySuccess | null> {
  return isNativeApp ? payInApp(options) : payOnWebsite(options, onFailedAttempt)
}

// ---------- Android app ----------

async function payInApp(options: PaymentOptions): Promise<RazorpaySuccess | null> {
  try {
    // The plugin's types say amount is a string; the SDK accepts the number of paise either way.
    const result = await Checkout.open({ ...options, amount: String(options.amount) })
    // On Android, response is an object with razorpay_payment_id, razorpay_order_id, razorpay_signature
    const data = result.response as unknown as RazorpaySuccess
    if (!data?.razorpay_payment_id) throw new Error('Razorpay did not return a payment id.')
    return data
  } catch (err) {
    // The SDK rejects with the error as JSON text, e.g. {"code":0,"description":"Payment cancelled by user"}
    const raw = err instanceof Error ? err.message : String(err)
    let code: number | undefined
    let description = raw
    try {
      const parsed = JSON.parse(raw)
      code = parsed?.code
      description = parsed?.description ?? raw
    } catch {
      /* not JSON: keep the text as it is */
    }
    if (code === 0 || /cancel/i.test(description)) return null // the member closed the window (Checkout.PAYMENT_CANCELED = 0)
    throw new Error(`Payment failed: ${description}`)
  }
}

// ---------- Website ----------

interface RazorpayFailure {
  error: { description: string }
}

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', handler: (response: RazorpayFailure) => void) => void
}

interface WebCheckoutOptions extends PaymentOptions {
  handler: (response: RazorpaySuccess) => void
  modal: { ondismiss: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: WebCheckoutOptions) => RazorpayInstance
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

function loadScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

async function payOnWebsite(
  options: PaymentOptions,
  onFailedAttempt: (message: string) => void,
): Promise<RazorpaySuccess | null> {
  if (!(await loadScript()) || !window.Razorpay) {
    throw new Error('Could not load Razorpay. Check your internet connection.')
  }
  const Razorpay = window.Razorpay
  return new Promise((resolve) => {
    const checkout = new Razorpay({
      ...options,
      handler: (response) => resolve(response), // paid
      modal: { ondismiss: () => resolve(null) }, // closed without paying
    })
    checkout.on('payment.failed', (r) => onFailedAttempt(`Payment failed: ${r.error.description}`))
    checkout.open()
  })
}
