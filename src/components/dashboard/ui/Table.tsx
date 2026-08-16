import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export function Table({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ui-glow-sm overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <table
        className={`w-full min-w-[720px] text-left text-sm text-[var(--ui-text)] ${className}`}
        {...props}
      />
    </div>
  )
}

export function THead({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-[var(--ui-border)] bg-gradient-to-b from-[var(--ui-surface-alt)] to-[var(--ui-surface)] text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)] ${className}`}
      {...props}
    />
  )
}

export function TBody({
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-[var(--ui-border)] ${className}`} {...props} />
}

export function Th({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 font-semibold ${className}`} {...props} />
}

export function Td({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 align-middle ${className}`} {...props} />
}

export function Tr({
  className = '',
  onClick,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-[var(--ui-surface-alt)]' : ''} hover:bg-[var(--ui-surface-alt)]/60 ${className}`}
      {...props}
    />
  )
}
