// Loads Razorpay Checkout (their script) only when someone is about to pay.

export interface RazorpaySuccess {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayFailure {
  error: { description: string }
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill: { name: string; email: string }
  theme: { color: string }
  config?: CheckoutDisplayConfig
  handler: (response: RazorpaySuccess) => void
  modal: { ondismiss: () => void }
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

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', handler: (response: RazorpayFailure) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

export function loadRazorpay(): Promise<boolean> {
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

export function openCheckout(options: RazorpayOptions, onFailed: (message: string) => void) {
  if (!window.Razorpay) throw new Error('Razorpay is not loaded')
  const checkout = new window.Razorpay(options)
  checkout.on('payment.failed', (r) => onFailed(r.error.description))
  checkout.open()
}
