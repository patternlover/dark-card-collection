import type { ReactNode } from 'react'

export function ModalSection({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--ui-accent)]">
          {title}
        </h3>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
