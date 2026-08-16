import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const fieldBase =
  'w-full rounded-md border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-faint)] outline-none transition-all duration-150 focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent-soft)] focus:shadow-[0_0_12px_var(--ui-accent-soft)]'

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1 block text-xs font-medium text-[var(--ui-text-muted)] ${className}`}
      {...props}
    />
  )
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} min-h-[96px] ${className}`} {...props} />
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${fieldBase} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[var(--ui-danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--ui-text-faint)]">{hint}</p>
      ) : null}
    </div>
  )
}
