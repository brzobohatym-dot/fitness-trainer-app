'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#dc2626' }}>Chyba aplikace</h1>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          maxWidth: '600px'
        }}>
          <p style={{ fontFamily: 'monospace', fontSize: '14px', color: '#991b1b', wordBreak: 'break-all' }}>
            {error.message}
          </p>
          {error.stack && (
            <pre style={{ fontSize: '11px', color: '#b91c1c', overflow: 'auto', maxHeight: '200px', marginTop: '0.5rem' }}>
              {error.stack}
            </pre>
          )}
          {error.digest && (
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '0.5rem' }}>Digest: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          style={{ padding: '0.5rem 1rem', background: '#253D66', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Zkusit znovu
        </button>
      </body>
    </html>
  )
}
