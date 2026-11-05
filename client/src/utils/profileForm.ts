import type { Gender, ProfileFor } from '../services/auth'
import type {
  MaritalStatus,
  MyProfile,
  PartnerPreferenceRequest,
  PhotoPrivacy,
  Religiosity,
  Sect,
  UpdateProfileRequest,
} from '../services/profile'

// Same rule as ProfileService.MinAboutMeLength on the server
export const MIN_ABOUT_LENGTH = 30

// The wizard keeps everything as strings (that is what inputs give us)
// and converts to the API shape only when saving.

export interface ProfileFormValues {
  profileFor: ProfileFor
  firstName: string
  lastName: string
  showLastName: boolean
  gender: Gender
  dateOfBirth: string
  maritalStatus: MaritalStatus
  heightCm: string
  country: string
  state: string
  city: string
  education: string
  occupation: string
  sect: Sect | ''
  religiosity: Religiosity | ''
  motherTongue: string
  aboutMe: string
  fatherOccupation: string
  motherOccupation: string
  brothers: string
  sisters: string
  familyDetails: string
  photoPrivacy: PhotoPrivacy
}

export interface PreferenceFormValues {
  ageMin: string
  ageMax: string
  heightMinCm: string
  heightMaxCm: string
  maritalStatuses: string[]
  sects: string[]
  cities: string // comma separated in the input
  education: string
  notes: string
}

const text = (v: string | null | undefined) => v ?? ''
const numText = (v: number | null | undefined) => (v == null ? '' : String(v))
const orNull = (v: string) => (v.trim() === '' ? null : v.trim())
const intOrNull = (v: string) => (v === '' ? null : Number(v))

export function toFormValues(p: MyProfile): ProfileFormValues {
  return {
    profileFor: p.profileFor,
    firstName: p.firstName,
    lastName: text(p.lastName),
    showLastName: p.showLastName,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth,
    maritalStatus: p.maritalStatus,
    heightCm: numText(p.heightCm),
    country: p.country || 'India',
    state: text(p.state),
    city: p.city,
    education: text(p.education),
    occupation: text(p.occupation),
    sect: p.sect ?? '',
    religiosity: p.religiosity ?? '',
    motherTongue: text(p.motherTongue),
    aboutMe: text(p.aboutMe),
    fatherOccupation: text(p.fatherOccupation),
    motherOccupation: text(p.motherOccupation),
    brothers: numText(p.brothers),
    sisters: numText(p.sisters),
    familyDetails: text(p.familyDetails),
    photoPrivacy: p.photoPrivacy,
  }
}

export function toProfileRequest(v: ProfileFormValues): UpdateProfileRequest {
  return {
    profileFor: v.profileFor,
    firstName: v.firstName.trim(),
    lastName: orNull(v.lastName),
    showLastName: v.showLastName,
    gender: v.gender,
    dateOfBirth: v.dateOfBirth,
    maritalStatus: v.maritalStatus,
    heightCm: intOrNull(v.heightCm),
    country: orNull(v.country),
    state: orNull(v.state),
    city: orNull(v.city),
    education: orNull(v.education),
    occupation: orNull(v.occupation),
    sect: v.sect || null,
    religiosity: v.religiosity || null,
    motherTongue: orNull(v.motherTongue),
    aboutMe: orNull(v.aboutMe),
    fatherOccupation: orNull(v.fatherOccupation),
    motherOccupation: orNull(v.motherOccupation),
    brothers: intOrNull(v.brothers),
    sisters: intOrNull(v.sisters),
    familyDetails: orNull(v.familyDetails),
    photoPrivacy: v.photoPrivacy,
  }
}

export function toPreferenceValues(p: MyProfile): PreferenceFormValues {
  const pp = p.partnerPreference
  if (pp) {
    return {
      ageMin: String(pp.ageMin),
      ageMax: String(pp.ageMax),
      heightMinCm: numText(pp.heightMinCm),
      heightMaxCm: numText(pp.heightMaxCm),
      maritalStatuses: pp.maritalStatuses,
      sects: pp.sects,
      cities: pp.cities.join(', '),
      education: text(pp.education),
      notes: text(pp.notes),
    }
  }
  // Sensible starting range based on the person's own age
  const min = p.gender === 'Female' ? p.age : Math.max(18, p.age - 7)
  const max = p.gender === 'Female' ? Math.min(70, p.age + 7) : p.age
  return {
    ageMin: String(min),
    ageMax: String(Math.max(min, max)),
    heightMinCm: '',
    heightMaxCm: '',
    maritalStatuses: [],
    sects: [],
    cities: '',
    education: '',
    notes: '',
  }
}

export function toPreferenceRequest(v: PreferenceFormValues): PartnerPreferenceRequest {
  return {
    ageMin: Number(v.ageMin),
    ageMax: Number(v.ageMax),
    heightMinCm: intOrNull(v.heightMinCm),
    heightMaxCm: intOrNull(v.heightMaxCm),
    maritalStatuses: v.maritalStatuses,
    sects: v.sects,
    cities: v.cities.split(',').map((c) => c.trim()).filter(Boolean),
    education: orNull(v.education),
    notes: orNull(v.notes),
  }
}

// Which wizard step fixes a "missing field" message from the API
export function stepForMissingField(field: string): number {
  if (['City', 'Education', 'Occupation'].includes(field)) return 2
  if (field === 'Sect' || field === 'Religious practice' || field.startsWith('About')) return 3
  if (field === 'Partner preferences') return 5
  return 1
}
