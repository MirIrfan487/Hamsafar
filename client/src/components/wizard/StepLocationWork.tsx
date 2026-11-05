import FormField from '../FormField'
import type { ProfileStepProps } from './types'

export default function StepLocationWork({ values, update }: ProfileStepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Country" name="country" value={values.country} onChange={(e) => update({ country: e.target.value })} maxLength={60} />
      <FormField label="State" name="state" value={values.state} onChange={(e) => update({ state: e.target.value })} maxLength={60} />
      <FormField
        label="City"
        name="city"
        value={values.city}
        onChange={(e) => update({ city: e.target.value })}
        maxLength={60}
        placeholder="e.g. Srinagar"
        required
      />
      <div className="hidden sm:block" />
      <FormField
        label="Highest education"
        name="education"
        value={values.education}
        onChange={(e) => update({ education: e.target.value })}
        maxLength={100}
        placeholder="e.g. MBA, B.Tech, Alimiyyah"
        required
      />
      <FormField
        label="Occupation"
        name="occupation"
        value={values.occupation}
        onChange={(e) => update({ occupation: e.target.value })}
        maxLength={100}
        placeholder="e.g. Teacher, Software engineer"
        required
      />
    </div>
  )
}
