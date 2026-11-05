import type { PreferenceFormValues, ProfileFormValues } from '../../utils/profileForm'

// Every profile step gets the current values and a function to change some of them
export interface ProfileStepProps {
  values: ProfileFormValues
  update: (patch: Partial<ProfileFormValues>) => void
}

export interface PreferenceStepProps {
  values: PreferenceFormValues
  update: (patch: Partial<PreferenceFormValues>) => void
}
