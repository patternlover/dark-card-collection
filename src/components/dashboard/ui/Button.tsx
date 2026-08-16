import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--ui-bg)] disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary:
    'ui-glow-sm bg-[var(--ui-accent)] text-[var(--ui-accent-foreground)] shadow-[0_0_12px_var(--ui-accent-soft)] hover:bg-[var(--ui-accent-hover)] hover:shadow-[0_0_18px_rgba(129,140,248,0.35)]',
  secondary:
    'border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:border-[var(--ui-accent)]/50 hover:bg-[var(--ui-surface-alt)]',
  ghost: 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-alt)] hover:text-[var(--ui-text)]',
  danger: 'bg-[var(--ui-danger)] text-white hover:opacity-90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
