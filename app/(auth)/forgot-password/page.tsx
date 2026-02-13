'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Chyba při odesílání emailu. Zkuste to znovu.')
    } else {
      setMessage('Email s odkazem pro obnovení hesla byl odeslán. Zkontrolujte svou schránku.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">FitTrainer</h1>
          <p className="mt-2 text-gray-600">Obnovení hesla</p>
        </div>

        <div className="card">
          {message ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
                {message}
              </div>
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Zpět na přihlášení
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Zadejte svůj email a my vám pošleme odkaz pro obnovení hesla.
              </p>

              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input mt-1"
                  placeholder="vas@email.cz"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Odesílám...' : 'Odeslat odkaz pro obnovení'}
              </button>

              <p className="text-center text-sm text-gray-600">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Zpět na přihlášení
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
