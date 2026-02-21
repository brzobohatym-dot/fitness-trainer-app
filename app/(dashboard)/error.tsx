'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Nastala chyba</h2>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left max-w-lg mx-auto">
        <p className="text-sm text-red-800 font-mono break-all">{error.message}</p>
        {error.stack && (
          <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">{error.stack}</pre>
        )}
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Zkusit znovu
      </button>
    </div>
  )
}
