import FormField from '../FormField'
import SelectField from '../SelectField'
import TextAreaField from '../TextAreaField'
import { COUNT_OPTIONS } from '../../utils/options'
import type { ProfileStepProps } from './types'

// All family fields are optional, but they help families decide
export default function StepFamily({ values, update }: ProfileStepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Father's occupation"
          name="fatherOccupation"
          value={values.fatherOccupation}
          onChange={(e) => update({ fatherOccupation: e.target.value })}
          maxLength={100}
        />
        <FormField
          label="Mother's occupation"
          name="motherOccupation"
          value={values.motherOccupation}
          onChange={(e) => update({ motherOccupation: e.target.value })}
          maxLength={100}
        />
        <SelectField
          label="Brothers"
          name="brothers"
          value={values.brothers}
          onChange={(v) => update({ brothers: v })}
          options={COUNT_OPTIONS}
          placeholder="Prefer not to say"
        />
        <SelectField
          label="Sisters"
          name="sisters"
          value={values.sisters}
          onChange={(v) => update({ sisters: v })}
          options={COUNT_OPTIONS}
          placeholder="Prefer not to say"
        />
      </div>
      <TextAreaField
        label="About the family (optional)"
        name="familyDetails"
        value={values.familyDetails}
        onChange={(v) => update({ familyDetails: v })}
        maxLength={1000}
        rows={4}
        placeholder="e.g. Joint family settled in Srinagar. Father runs a business."
      />
    </div>
  )
}
