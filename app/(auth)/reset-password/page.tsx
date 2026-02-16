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
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes (when token from URL is processed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true)
          setInitializing(false)
        } else if (event === 'SIGNED_IN' && session) {
          setSessionReady(true)
          setInitializing(false)
        }
      }
    )

    // Check if user already has a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
      setInitializing(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
      console.error('Password update error:', error)
      if (error.message.includes('session')) {
        setError('Odkaz pro obnovení hesla vypršel. Požádejte o nový.')
      } else {
        setError('Chyba při změně hesla: ' + error.message)
      }
    } else {
      setMessage('Heslo bylo úspěšně změněno!')
      // Sign out to force fresh login with new password
      await supabase.auth.signOut()
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
          {initializing ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Ověřování odkazu...</p>
            </div>
          ) : message ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
                {message}
              </div>
              <p className="text-sm text-gray-600">Přesměrování na přihlášení...</p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center">
              <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-4">
                Odkaz pro obnovení hesla je neplatný nebo vypršel.
              </div>
              <Link
                href="/forgot-password"
                className="btn btn-primary"
              >
                Požádat o nový odkaz
              </Link>
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
