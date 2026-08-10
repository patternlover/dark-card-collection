'use client'

import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  'google-not-configured': 'Accesso Google non configurato.',
  'google-denied': 'Accesso con Google annullato.',
  'google-state': 'Sessione non valida. Riprova.',
  'google-token': 'Impossibile verificare il token Google.',
  'google-email': 'Email non verificata da Google.',
  'google-not-allowed': 'Questa email non è autorizzata ad accedere alla dashboard.',
  'google-error': 'Errore durante l\'accesso con Google.',
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export default function DashboardLogin() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = error ? ERROR_MESSAGES[error] || 'Errore durante l\'accesso.' : null

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--ui-text-faint)]">Area Riservata</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--ui-text)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Accedi con il tuo account Google autorizzato.</p>
        <div className="mt-6 space-y-4">
          {message ? (
            <p className="rounded-md border border-[var(--ui-danger)]/40 bg-[var(--ui-danger-soft)] px-3 py-2 text-sm text-[var(--ui-danger)]">
              {message}
            </p>
          ) : null}
          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] px-4 py-2.5 font-semibold text-[var(--ui-text)] transition-colors hover:border-[var(--ui-accent)] hover:bg-[var(--ui-accent-soft)]"
          >
            <GoogleIcon />
            Accedi con Google
          </a>
        </div>
      </div>
    </div>
  )
}
