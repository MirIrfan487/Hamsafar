import type { Gender, ProfileFor } from '../services/auth'
import type { MaritalStatus, PhotoPrivacy, ProfileStatus, Religiosity, Sect } from '../services/profile'

// Dropdown / radio choices with friendly labels. `value` must match the API exactly.
export interface Option<T extends string = string> {
  value: T
  label: string
  description?: string
}

export const PROFILE_FOR_OPTIONS: Option<ProfileFor>[] = [
  { value: 'Self', label: 'Myself' },
  { value: 'Son', label: 'My son' },
  { value: 'Daughter', label: 'My daughter' },
  { value: 'Brother', label: 'My brother' },
  { value: 'Sister', label: 'My sister' },
  { value: 'Relative', label: 'A relative or friend' },
]

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

export const MARITAL_STATUS_OPTIONS: Option<MaritalStatus>[] = [
  { value: 'NeverMarried', label: 'Never married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
]

export const SECT_OPTIONS: Option<Sect>[] = [
  { value: 'Sunni', label: 'Sunni' },
  { value: 'Shia', label: 'Shia' },
  { value: 'JustMuslim', label: 'Just Muslim' },
  { value: 'Other', label: 'Other' },
]

export const RELIGIOSITY_OPTIONS: Option<Religiosity>[] = [
  { value: 'VeryPracticing', label: 'Very practicing' },
  { value: 'Practicing', label: 'Practicing' },
  { value: 'ModeratelyPracticing', label: 'Moderately practicing' },
  { value: 'NotPracticing', label: 'Not practicing' },
]

export const PHOTO_PRIVACY_OPTIONS: Option<PhotoPrivacy>[] = [
  { value: 'AllMembers', label: 'All members', description: 'Anyone who is logged in can see the photos.' },
  { value: 'AcceptedInterestsOnly', label: 'Only people I accept', description: 'Photos stay hidden until you accept their interest.' },
  { value: 'Hidden', label: 'No one', description: 'Photos are never shown to other members.' },
]

export const STATUS_LABELS: Record<ProfileStatus, string> = {
  Draft: 'Draft',
  PendingApproval: 'Waiting for approval',
  Approved: 'Approved',
  Rejected: 'Needs changes',
}

// 4'6" to 7'0" in 1-inch steps, stored in cm
export const HEIGHT_OPTIONS: Option[] = Array.from({ length: 31 }, (_, i) => {
  const inches = 54 + i
  const cm = Math.round(inches * 2.54)
  return { value: String(cm), label: `${Math.floor(inches / 12)}'${inches % 12}" (${cm} cm)` }
})

export const COUNT_OPTIONS: Option[] = Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }))

export const AGE_OPTIONS: Option[] = Array.from({ length: 53 }, (_, i) => ({ value: String(18 + i), label: String(18 + i) }))

export function labelFor(options: Option[], value: string | null | undefined): string {
  if (!value) return ''
  return options.find((o) => o.value === value)?.label ?? value
}

export function heightLabel(cm: string): string {
  return labelFor(HEIGHT_OPTIONS, cm) || (cm ? `${cm} cm` : '')
}

// Who created the profile, as shown to other members
export const CREATED_BY_LABELS: Record<ProfileFor, string> = {
  Self: 'Created by the member',
  Son: 'Created by a parent',
  Daughter: 'Created by a parent',
  Brother: 'Created by a sibling',
  Sister: 'Created by a sibling',
  Relative: 'Created by a relative or friend',
}

export const SORT_OPTIONS: Option[] = [
  { value: 'Newest', label: 'Newest first' },
  { value: 'Youngest', label: 'Youngest first' },
  { value: 'Oldest', label: 'Oldest first' },
]
