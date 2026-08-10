import type { HTMLAttributes } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--ui-surface-alt)] text-[var(--ui-text-muted)] border-[var(--ui-border-strong)]',
  accent: 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent-hover)] border-[var(--ui-accent)]/30',
  success: 'bg-[var(--ui-success-soft)] text-[var(--ui-success)] border-[var(--ui-success)]/30',
  warning: 'bg-[var(--ui-warning-soft)] text-[var(--ui-warning)] border-[var(--ui-warning)]/30',
  danger: 'bg-[var(--ui-danger-soft)] text-[var(--ui-danger)] border-[var(--ui-danger)]/30',
  info: 'bg-[var(--ui-info-soft)] text-[var(--ui-info)] border-[var(--ui-info)]/30',
}

export function Badge({
  tone = 'neutral',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
      {...props}
    />
  )
}
