import FormField from '../FormField'
import SelectField from '../SelectField'
import { GENDER_OPTIONS, HEIGHT_OPTIONS, MARITAL_STATUS_OPTIONS, PROFILE_FOR_OPTIONS } from '../../utils/options'
import { maxBirthDateForAge } from '../../utils/date'
import type { Gender, ProfileFor } from '../../services/auth'
import type { MaritalStatus } from '../../services/profile'
import type { ProfileStepProps } from './types'

const MAX_DOB = maxBirthDateForAge(18)

export default function StepBasic({ values, update }: ProfileStepProps) {
  // Keep an older saved height visible even if it is not in the list
  const heights =
    values.heightCm && !HEIGHT_OPTIONS.some((o) => o.value === values.heightCm)
      ? [...HEIGHT_OPTIONS, { value: values.heightCm, label: `${values.heightCm} cm` }]
      : HEIGHT_OPTIONS

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField
        label="This profile is for"
        name="profileFor"
        value={values.profileFor}
        onChange={(v) => update({ profileFor: v as ProfileFor })}
        options={PROFILE_FOR_OPTIONS}
      />
      <SelectField
        label="Marital status"
        name="maritalStatus"
        value={values.maritalStatus}
        onChange={(v) => update({ maritalStatus: v as MaritalStatus })}
        options={MARITAL_STATUS_OPTIONS}
      />

      <FormField
        label="First name"
        name="firstName"
        value={values.firstName}
        onChange={(e) => update({ firstName: e.target.value })}
        maxLength={50}
        required
      />
      <FormField
        label="Last name (optional)"
        name="lastName"
        value={values.lastName}
        onChange={(e) => update({ lastName: e.target.value })}
        maxLength={50}
      />
      <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
        <input
          type="checkbox"
          checked={values.showLastName}
          onChange={(e) => update({ showLastName: e.target.checked })}
          className="h-4 w-4 accent-brand-600"
        />
        Show the last name to other members
      </label>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Gender</legend>
        <div className="mt-2 flex gap-6">
          {GENDER_OPTIONS.map((g) => (
            <label key={g.value} className="flex items-center gap-2 text-ink">
              <input
                type="radio"
                name="gender"
                value={g.value}
                checked={values.gender === g.value}
                onChange={() => update({ gender: g.value as Gender })}
                className="accent-brand-600"
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>
      <FormField
        label="Date of birth"
        name="dateOfBirth"
        type="date"
        value={values.dateOfBirth}
        onChange={(e) => update({ dateOfBirth: e.target.value })}
        max={MAX_DOB}
        hint="Must be 18 or older."
        required
      />

      <SelectField
        label="Height (optional)"
        name="heightCm"
        value={values.heightCm}
        onChange={(v) => update({ heightCm: v })}
        options={heights}
        placeholder="Prefer not to say"
      />
    </div>
  )
}
