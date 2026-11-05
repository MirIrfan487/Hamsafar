import type { Option } from '../utils/options'

interface SelectFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string // shown as an empty first choice, e.g. "Select" or "Any"
  hint?: string
}

export default function SelectField({ label, name, value, onChange, options, placeholder, hint }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
