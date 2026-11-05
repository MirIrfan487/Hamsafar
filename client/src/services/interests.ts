import { apiRequest } from './api'
import type { ProfileCard } from './search'

export type InterestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'
export type InterestDirection = 'Sent' | 'Received'
export type InterestBox = 'Received' | 'Sent' | 'Connected'

export interface Interest {
  id: number
  direction: InterestDirection
  status: InterestStatus
  note: string | null
  createdAtUtc: string
  respondedAtUtc: string | null
  otherProfile: ProfileCard
}

export interface InterestBetween {
  id: number
  direction: InterestDirection
  status: InterestStatus
}

export interface InterestSummary {
  receivedPending: number
  sentPending: number
  connected: number
}

export const interestsApi = {
  list: (box: InterestBox) => apiRequest<Interest[]>(`/interests?box=${box}`, { auth: true }),
  summary: () => apiRequest<InterestSummary>('/interests/summary', { auth: true }),
  send: (receiverProfileId: number, note: string) =>
    apiRequest<Interest>('/interests', { method: 'POST', body: { receiverProfileId, note: note.trim() || null }, auth: true }),
  accept: (id: number) => apiRequest<Interest>(`/interests/${id}/accept`, { method: 'POST', auth: true }),
  reject: (id: number) => apiRequest<Interest>(`/interests/${id}/reject`, { method: 'POST', auth: true }),
  withdraw: (id: number) => apiRequest<Interest>(`/interests/${id}/withdraw`, { method: 'POST', auth: true }),
}
