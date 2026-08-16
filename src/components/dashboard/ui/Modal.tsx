'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col rounded-lg border border-[var(--ui-accent)]/30 bg-[var(--ui-surface)] shadow-[0_0_40px_rgba(129,140,248,0.15)]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--ui-border)] bg-gradient-to-b from-[var(--ui-surface-alt)]/70 to-transparent px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--ui-text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-md p-1 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-alt)] hover:text-[var(--ui-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--ui-border)] px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
