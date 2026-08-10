import type { HTMLAttributes } from 'react'

export type AlertTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<AlertTone, string> = {
  neutral: 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] text-[var(--ui-text-muted)]',
  success: 'border-[var(--ui-success)]/30 bg-[var(--ui-success-soft)] text-[var(--ui-success)]',
  warning: 'border-[var(--ui-warning)]/30 bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]',
  danger: 'border-[var(--ui-danger)]/30 bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]',
  info: 'border-[var(--ui-info)]/30 bg-[var(--ui-info-soft)] text-[var(--ui-info)]',
}

export function Alert({
  tone = 'neutral',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  return (
    <div
      role="alert"
      className={`rounded-md border px-3 py-2 text-sm ${tones[tone]} ${className}`}
      {...props}
    />
  )
}
