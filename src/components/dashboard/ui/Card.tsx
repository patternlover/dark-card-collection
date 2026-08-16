import type { HTMLAttributes } from 'react'

export function Card({
  className = '',
  onClick,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] ${onClick ? 'cursor-pointer transition-colors hover:border-[var(--ui-border-strong)]' : ''} ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between gap-2 border-b border-[var(--ui-border)] px-4 py-3 ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-sm font-semibold text-[var(--ui-text)] ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-4 py-4 ${className}`} {...props} />
}
