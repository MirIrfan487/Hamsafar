import type { Option } from '../utils/options'

// Multi-select as checkboxes. Nothing ticked = "any".
interface CheckboxGroupProps {
  label: string
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  hint?: string
}

export default function CheckboxGroup({ label, options, values, onChange, hint }: CheckboxGroupProps) {
  const toggle = (value: string) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = values.includes(o.value)
          return (
            <label
              key={o.value}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm ring-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600 ${
                checked ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink ring-gray-300 hover:bg-peach-50'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          )
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </fieldset>
  )
}
