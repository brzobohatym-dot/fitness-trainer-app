'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Hesla se neshodují')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError('Chyba při změně hesla. Odkaz mohl vypršet.')
    } else {
      setMessage('Heslo bylo úspěšně změněno!')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">FitTrainer</h1>
          <p className="mt-2 text-gray-600">Nastavení nového hesla</p>
        </div>

        <div className="card">
          {message ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
                {message}
              </div>
              <p className="text-sm text-gray-600">Přesměrování na přihlášení...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="label">
                  Nové heslo
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input mt-1"
                  placeholder="Minimálně 6 znaků"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Potvrďte heslo
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input mt-1"
                  placeholder="Zadejte heslo znovu"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Ukládám...' : 'Nastavit nové heslo'}
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
