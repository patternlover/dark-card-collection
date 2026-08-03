'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0, background: '#000' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            padding: '16px',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              border: '2px solid #27272a',
              background: '#18181b',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '4px 4px 0 0 #27272a',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Qualcosa è andato storto
            </h1>
            <p style={{ margin: '12px 0 24px', fontSize: '14px', color: '#a1a1aa' }}>
              {error.digest ? `Errore ${error.digest}` : 'Si è verificato un errore inatteso.'}
            </p>
            <button
              onClick={reset}
              style={{
                border: '2px solid #FACC15',
                background: '#FACC15',
                color: '#000',
                fontWeight: 700,
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Riprova
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
