import type { ReactNode } from 'react'

export function TogglePills<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-md border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] p-0.5 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-[var(--ui-accent)] text-[var(--ui-accent-foreground)]'
                : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-alt)] hover:text-[var(--ui-text)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
