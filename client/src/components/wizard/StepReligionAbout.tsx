import FormField from '../FormField'
import SelectField from '../SelectField'
import TextAreaField from '../TextAreaField'
import { PHOTO_PRIVACY_OPTIONS, RELIGIOSITY_OPTIONS, SECT_OPTIONS } from '../../utils/options'
import { MIN_ABOUT_LENGTH } from '../../utils/profileForm'
import type { PhotoPrivacy, Religiosity, Sect } from '../../services/profile'
import type { ProfileStepProps } from './types'

export default function StepReligionAbout({ values, update }: ProfileStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Sect"
          name="sect"
          value={values.sect}
          onChange={(v) => update({ sect: v as Sect | '' })}
          options={SECT_OPTIONS}
          placeholder="Select"
        />
        <SelectField
          label="Religious practice"
          name="religiosity"
          value={values.religiosity}
          onChange={(v) => update({ religiosity: v as Religiosity | '' })}
          options={RELIGIOSITY_OPTIONS}
          placeholder="Select"
        />
        <FormField
          label="Mother tongue"
          name="motherTongue"
          value={values.motherTongue}
          onChange={(e) => update({ motherTongue: e.target.value })}
          maxLength={40}
          placeholder="e.g. Kashmiri, Urdu"
        />
      </div>

      <TextAreaField
        label="About"
        name="aboutMe"
        value={values.aboutMe}
        onChange={(v) => update({ aboutMe: v })}
        maxLength={2000}
        minLength={MIN_ABOUT_LENGTH}
        rows={5}
        placeholder="Nature, values, interests, and what kind of family life is hoped for."
        hint="Please do not include phone numbers or email addresses."
      />

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Who can see the photos?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {PHOTO_PRIVACY_OPTIONS.map((o) => {
            const checked = values.photoPrivacy === o.value
            return (
              <label
                key={o.value}
                className={`cursor-pointer rounded-xl p-3 ring-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600 ${
                  checked ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-gray-300 hover:bg-peach-50'
                }`}
              >
                <input
                  type="radio"
                  name="photoPrivacy"
                  className="sr-only"
                  checked={checked}
                  onChange={() => update({ photoPrivacy: o.value as PhotoPrivacy })}
                />
                <span className="block text-sm font-semibold text-ink">{o.label}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">{o.description}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
