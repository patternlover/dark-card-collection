'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">Errore</h1>
        <p className="text-xl text-zinc-400 mb-2">Qualcosa è andato storto</p>
        <p className="text-sm text-zinc-600 mb-8">
          Si è verificato un errore imprevisto. Riprova più tardi.
        </p>
        <button
          onClick={reset}
          className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Riprova
        </button>
      </div>
    </div>
  )
}
