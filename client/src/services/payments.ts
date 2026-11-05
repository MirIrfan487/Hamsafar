import { apiRequest } from './api'

export interface Plan {
  code: string
  name: string
  priceInPaise: number
  durationDays: number
  canChat: boolean
  canViewContactDetails: boolean
  interestsPerMonth: number | null
}

export interface PaymentHistoryItem {
  id: number
  planName: string
  amountInPaise: number
  status: 'Created' | 'Paid' | 'Failed'
  createdAtUtc: string
  paidAtUtc: string | null
}

export interface MySubscription {
  isPremium: boolean
  planName: string | null
  premiumUntilUtc: string | null
  payments: PaymentHistoryItem[]
}

export interface CreateOrderResponse {
  keyId: string
  orderId: string
  amountInPaise: number
  currency: string
  planName: string
  prefillName: string
  prefillEmail: string
}

export interface ContactDetails {
  email: string | null
  phoneNumber: string | null
}

export const paymentsApi = {
  plans: () => apiRequest<Plan[]>('/plans'),
  mine: () => apiRequest<MySubscription>('/subscription/me', { auth: true }),
  createOrder: (planCode: string) =>
    apiRequest<CreateOrderResponse>('/payments/order', { method: 'POST', body: { planCode }, auth: true }),
  verify: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) =>
    apiRequest<MySubscription>('/payments/verify', {
      method: 'POST',
      body: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
      auth: true,
    }),
  contact: (profileId: number) => apiRequest<ContactDetails>(`/profiles/${profileId}/contact`, { auth: true }),
}

// 29900 -> "₹299"
export const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: paise % 100 === 0 ? 0 : 2 })}`
