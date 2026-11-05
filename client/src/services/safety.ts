import { apiRequest } from './api'
import type { ReportReason } from './admin'

export interface BlockedMember {
  profileId: number
  displayName: string
  city: string
  blockedAtUtc: string
}

export const safetyApi = {
  report: (profileId: number, reason: ReportReason, details: string) =>
    apiRequest<void>(`/profiles/${profileId}/report`, { method: 'POST', body: { reason, details: details.trim() || null }, auth: true }),
  block: (profileId: number) => apiRequest<void>(`/profiles/${profileId}/block`, { method: 'POST', auth: true }),
  unblock: (profileId: number) => apiRequest<void>(`/profiles/${profileId}/block`, { method: 'DELETE', auth: true }),
  blocked: () => apiRequest<BlockedMember[]>('/blocks', { auth: true }),
}
