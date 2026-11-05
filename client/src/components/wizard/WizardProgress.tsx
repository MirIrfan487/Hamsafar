// Progress bar + step names. Steps already passed can be clicked to go back.
interface WizardProgressProps {
  steps: string[]
  current: number // 1-based
  onSelect: (step: number) => void
}

export default function WizardProgress({ steps, current, onSelect }: WizardProgressProps) {
  const percent = Math.round(((current - 1) / (steps.length - 1)) * 100)

  return (
    <div>
      <p className="text-sm text-ink-soft">
        Step {current} of {steps.length}: <span className="font-semibold text-ink">{steps[current - 1]}</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-peach-100">
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300" style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
      <ol className="mt-3 hidden gap-1 text-xs sm:flex">
        {steps.map((name, i) => {
          const n = i + 1
          const state = n === current ? 'current' : n < current ? 'done' : 'todo'
          return (
            <li key={name} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(n)}
                disabled={state === 'todo'}
                aria-current={state === 'current' ? 'step' : undefined}
                className={`w-full text-left ${
                  state === 'current' ? 'font-semibold text-brand-700' : state === 'done' ? 'text-ink-soft hover:text-brand-600' : 'text-gray-400'
                }`}
              >
                {name}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
