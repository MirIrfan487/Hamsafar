import FormField from '../FormField'
import SelectField from '../SelectField'
import TextAreaField from '../TextAreaField'
import CheckboxGroup from '../CheckboxGroup'
import { AGE_OPTIONS, HEIGHT_OPTIONS, MARITAL_STATUS_OPTIONS, SECT_OPTIONS } from '../../utils/options'
import type { PreferenceStepProps } from './types'

export default function StepPreferences({ values, update }: PreferenceStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Age from" name="ageMin" value={values.ageMin} onChange={(v) => update({ ageMin: v })} options={AGE_OPTIONS} />
        <SelectField label="Age to" name="ageMax" value={values.ageMax} onChange={(v) => update({ ageMax: v })} options={AGE_OPTIONS} />
        <SelectField
          label="Height from"
          name="heightMinCm"
          value={values.heightMinCm}
          onChange={(v) => update({ heightMinCm: v })}
          options={HEIGHT_OPTIONS}
          placeholder="Any"
        />
        <SelectField
          label="Height to"
          name="heightMaxCm"
          value={values.heightMaxCm}
          onChange={(v) => update({ heightMaxCm: v })}
          options={HEIGHT_OPTIONS}
          placeholder="Any"
        />
      </div>

      <CheckboxGroup
        label="Marital status"
        options={MARITAL_STATUS_OPTIONS}
        values={values.maritalStatuses}
        onChange={(v) => update({ maritalStatuses: v })}
        hint="Leave all unticked for any."
      />
      <CheckboxGroup
        label="Sect"
        options={SECT_OPTIONS}
        values={values.sects}
        onChange={(v) => update({ sects: v })}
        hint="Leave all unticked for any."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Preferred cities"
          name="cities"
          value={values.cities}
          onChange={(e) => update({ cities: e.target.value })}
          placeholder="e.g. Srinagar, Baramulla"
          hint="Separate with commas. Leave empty for any."
        />
        <FormField
          label="Education"
          name="prefEducation"
          value={values.education}
          onChange={(e) => update({ education: e.target.value })}
          maxLength={100}
          placeholder="e.g. Graduate"
        />
      </div>

      <TextAreaField
        label="Anything else? (optional)"
        name="notes"
        value={values.notes}
        onChange={(v) => update({ notes: v })}
        maxLength={500}
        rows={3}
        placeholder="e.g. Should be willing to live in Kashmir."
      />
    </div>
  )
}
