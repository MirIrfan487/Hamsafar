import { apiRequest } from './api'
import type { Gender, ProfileFor } from './auth'

// These must match the C# enums exactly (the API sends enums as text)
export type MaritalStatus = 'NeverMarried' | 'Divorced' | 'Widowed'
export type Sect = 'Sunni' | 'Shia' | 'JustMuslim' | 'Other'
export type Religiosity = 'VeryPracticing' | 'Practicing' | 'ModeratelyPracticing' | 'NotPracticing'
export type PhotoPrivacy = 'AllMembers' | 'AcceptedInterestsOnly' | 'Hidden'
export type ProfileStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected'

export interface PartnerPreference {
  ageMin: number
  ageMax: number
  heightMinCm: number | null
  heightMaxCm: number | null
  maritalStatuses: string[]
  sects: string[]
  cities: string[]
  education: string | null
  notes: string | null
}

// GET /api/profile/me
export interface MyProfile {
  id: number
  profileFor: ProfileFor
  firstName: string
  lastName: string | null
  showLastName: boolean
  gender: Gender
  dateOfBirth: string // "YYYY-MM-DD"
  age: number
  maritalStatus: MaritalStatus
  heightCm: number | null
  country: string
  state: string | null
  city: string
  education: string | null
  occupation: string | null
  sect: Sect | null
  religiosity: Religiosity | null
  motherTongue: string | null
  aboutMe: string | null
  fatherOccupation: string | null
  motherOccupation: string | null
  brothers: number | null
  sisters: number | null
  familyDetails: string | null
  photoPrivacy: PhotoPrivacy
  status: ProfileStatus
  rejectionReason: string | null
  partnerPreference: PartnerPreference | null
  missingFields: string[] // what still needs filling before Submit
}

// PUT /api/profile/me
export interface UpdateProfileRequest {
  profileFor: ProfileFor
  firstName: string
  lastName: string | null
  showLastName: boolean
  gender: Gender
  dateOfBirth: string
  maritalStatus: MaritalStatus
  heightCm: number | null
  country: string | null
  state: string | null
  city: string | null
  education: string | null
  occupation: string | null
  sect: Sect | null
  religiosity: Religiosity | null
  motherTongue: string | null
  aboutMe: string | null
  fatherOccupation: string | null
  motherOccupation: string | null
  brothers: number | null
  sisters: number | null
  familyDetails: string | null
  photoPrivacy: PhotoPrivacy
}

// PUT /api/profile/me/preferences
export type PartnerPreferenceRequest = PartnerPreference

export const profileApi = {
  getMine: () => apiRequest<MyProfile>('/profile/me', { auth: true }),

  update: (data: UpdateProfileRequest) =>
    apiRequest<MyProfile>('/profile/me', { method: 'PUT', body: data, auth: true }),

  updatePreferences: (data: PartnerPreferenceRequest) =>
    apiRequest<MyProfile>('/profile/me/preferences', { method: 'PUT', body: data, auth: true }),

  submit: () => apiRequest<MyProfile>('/profile/me/submit', { method: 'POST', auth: true }),
}
