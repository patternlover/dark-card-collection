import type { HTMLAttributes } from 'react'

export function Toolbar({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2.5 ${className}`}
      {...props}
    />
  )
}
