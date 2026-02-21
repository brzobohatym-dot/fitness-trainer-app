'use client'

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Chyba ve zprávách</h2>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left max-w-lg mx-auto">
        <p className="text-sm text-red-800 font-mono break-all">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-red-500 mt-2">Digest: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="btn btn-primary"
      >
        Zkusit znovu
      </button>
    </div>
  )
}
