import { apiRequest } from './api'
import type { PagedResult } from './search'
import type { Gender, ProfileFor } from './auth'
import type { ProfileStatus } from './profile'

// These must match the C# enums (the API sends enums as text)
export type PhotoStatus = 'Pending' | 'Approved' | 'Rejected'
export type ReportReason = 'FakeProfile' | 'Harassment' | 'InappropriatePhoto' | 'ScamOrMoneyRequest' | 'AlreadyMarried' | 'Other'
export type ReportStatus = 'Open' | 'ActionTaken' | 'Dismissed'

export interface AdminStats {
  totalMembers: number
  newMembersLast7Days: number
  pendingProfiles: number
  approvedProfiles: number
  pendingPhotos: number
  openReports: number
  activePremiumMembers: number
  revenueThisMonthInPaise: number
}

export interface AdminPhoto {
  id: number
  profileId: number
  profileName: string
  isMain: boolean
  status: PhotoStatus
  uploadedAtUtc: string
}

export interface AdminProfileReview {
  id: number
  userEmail: string
  createdAtUtc: string
  updatedAtUtc: string
  status: ProfileStatus
  profileFor: ProfileFor
  firstName: string
  lastName: string | null
  gender: Gender
  dateOfBirth: string
  age: number
  maritalStatus: string
  heightCm: number | null
  country: string
  state: string | null
  city: string
  education: string | null
  occupation: string | null
  sect: string | null
  religiosity: string | null
  motherTongue: string | null
  aboutMe: string | null
  fatherOccupation: string | null
  motherOccupation: string | null
  brothers: number | null
  sisters: number | null
  familyDetails: string | null
  photos: AdminPhoto[]
}

export interface AdminPersonRef {
  profileId: number
  name: string
  email: string
  userId: string
  isSuspended: boolean
}

export interface AdminReport {
  id: number
  reason: ReportReason
  details: string | null
  status: ReportStatus
  createdAtUtc: string
  adminNote: string | null
  reporter: AdminPersonRef
  reported: AdminPersonRef
  reportsAgainstThisMember: number
}

export interface AdminMember {
  userId: string
  email: string
  profileId: number
  firstName: string
  gender: Gender
  city: string
  profileStatus: ProfileStatus
  isSuspended: boolean
  isPremium: boolean
  joinedAtUtc: string
  lastActiveAtUtc: string | null
}

export interface AuditLogItem {
  id: number
  adminEmail: string
  action: string
  targetType: string
  targetId: string
  note: string | null
  createdAtUtc: string
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  FakeProfile: 'Fake profile',
  Harassment: 'Harassment or abuse',
  InappropriatePhoto: 'Inappropriate photo',
  ScamOrMoneyRequest: 'Scam or asking for money',
  AlreadyMarried: 'Already married',
  Other: 'Something else',
}

const post = <T = void>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body: body ?? {}, auth: true })

export const adminApi = {
  stats: () => apiRequest<AdminStats>('/admin/stats', { auth: true }),

  pendingProfiles: (page: number) => apiRequest<PagedResult<AdminProfileReview>>(`/admin/profiles/pending?page=${page}`, { auth: true }),
  approveProfile: (id: number) => post(`/admin/profiles/${id}/approve`),
  rejectProfile: (id: number, reason: string) => post(`/admin/profiles/${id}/reject`, { reason }),

  pendingPhotos: (page: number) => apiRequest<PagedResult<AdminPhoto>>(`/admin/photos/pending?page=${page}`, { auth: true }),
  approvePhoto: (id: number) => post(`/admin/photos/${id}/approve`),
  rejectPhoto: (id: number, reason: string) => post(`/admin/photos/${id}/reject`, { reason }),

  reports: (status: ReportStatus, page: number) =>
    apiRequest<PagedResult<AdminReport>>(`/admin/reports?status=${status}&page=${page}`, { auth: true }),
  resolveReport: (id: number, outcome: 'ActionTaken' | 'Dismissed', note: string, suspendReportedMember: boolean) =>
    post(`/admin/reports/${id}/resolve`, { outcome, note: note.trim() || null, suspendReportedMember }),

  members: (q: string, page: number) =>
    apiRequest<PagedResult<AdminMember>>(`/admin/members?q=${encodeURIComponent(q)}&page=${page}`, { auth: true }),
  suspend: (userId: string, note: string) => post(`/admin/members/${encodeURIComponent(userId)}/suspend`, { note: note.trim() || null }),
  unsuspend: (userId: string) => post(`/admin/members/${encodeURIComponent(userId)}/unsuspend`),

  audit: (page: number) => apiRequest<PagedResult<AuditLogItem>>(`/admin/audit?page=${page}`, { auth: true }),
}
