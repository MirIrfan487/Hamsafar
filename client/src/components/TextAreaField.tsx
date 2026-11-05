interface TextAreaFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  minLength?: number // only used to show "x more characters needed"
  rows?: number
  placeholder?: string
  hint?: string
}

export default function TextAreaField({ label, name, value, onChange, maxLength, minLength, rows = 4, placeholder, hint }: TextAreaFieldProps) {
  const length = value.trim().length
  const needed = minLength ? Math.max(0, minLength - length) : 0

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-y"
      />
      <div className="mt-1 flex justify-between gap-4 text-xs text-gray-500">
        <span>{needed > 0 ? `${needed} more characters needed` : hint}</span>
        <span>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
