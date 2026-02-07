'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserRole, roleLabels } from '@/types/database'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('trainer')
  const [trainerCode, setTrainerCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // For clients, verify trainer code (trainer's user ID)
    let trainerId: string | null = null
    if (role === 'client') {
      if (!trainerCode) {
        setError('Pro registraci klienta je potřeba kód trenéra')
        setLoading(false)
        return
      }

      const { data: trainer, error: trainerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', trainerCode)
        .eq('role', 'trainer')
        .single<{ id: string }>()

      if (trainerError || !trainer) {
        setError('Neplatný kód trenéra')
        setLoading(false)
        return
      }
      trainerId = trainer.id
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user && trainerId) {
      // Update profile with trainer_id for clients
      await supabase
        .from('profiles')
        .update({ trainer_id: trainerId })
        .eq('id', authData.user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registrace</h1>
          <p className="mt-2 text-gray-600">
            Vytvořte si účet a začněte používat aplikaci
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="label">
                Jméno a příjmení
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input mt-1"
                placeholder="Jan Novák"
                required
              />
            </div>

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

            <div>
              <label htmlFor="password" className="label">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-1"
                placeholder="Minimálně 6 znaků"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="label">Typ účtu</label>
              <div className="mt-2 flex gap-4">
                {(['trainer', 'client'] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className={`flex-1 cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                      role === r
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <span className="font-medium">{roleLabels[r]}</span>
                  </label>
                ))}
              </div>
            </div>

            {role === 'client' && (
              <div>
                <label htmlFor="trainerCode" className="label">
                  Kód trenéra
                </label>
                <input
                  id="trainerCode"
                  type="text"
                  value={trainerCode}
                  onChange={(e) => setTrainerCode(e.target.value)}
                  className="input mt-1"
                  placeholder="Zadejte kód od vašeho trenéra"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Kód vám poskytne váš trenér
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Registruji...' : 'Vytvořit účet'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Již máte účet?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Přihlaste se
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Zpět na úvodní stránku
          </Link>
        </div>
      </div>
    </div>
  )
}
