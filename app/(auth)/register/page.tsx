'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

    try {
      const supabase = createClient()

      // If registering as client, verify trainer exists
      if (role === 'client' && trainerCode) {
        const { data: trainer, error: trainerError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', trainerCode)
          .eq('role', 'trainer')
          .single()

        if (trainerError || !trainer) {
          setError('Neplatný kód trenéra. Zkontrolujte prosím zadaný kód.')
          setLoading(false)
          return
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            trainer_id: role === 'client' ? trainerCode : null,
          },
        },
      })

      if (authError) {
        // Translate common Supabase errors to Czech
        if (authError.message.includes('already registered')) {
          setError('Tento email je již zaregistrován. Zkuste se přihlásit.')
        } else if (authError.message.includes('Invalid email')) {
          setError('Neplatný formát emailu.')
        } else if (authError.message.includes('Password')) {
          setError('Heslo musí mít alespoň 6 znaků.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      router.push(role === 'trainer' ? '/dashboard' : '/client')
      router.refresh()
    } catch (err) {
      console.error('Registration error:', err)
      setError('Chyba připojení k serveru. Zkuste to prosím znovu.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-no-repeat opacity-5 scale-150" />
        <div className="relative z-10 text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={300}
            height={150}
            className="mx-auto mb-8"
          />
          <h1 className="text-4xl font-bold text-white mb-4">
            Připojte se k nám
          </h1>
          <p className="text-primary-200 text-lg max-w-md">
            Vytvořte si účet a začněte spravovat tréninkové plány
          </p>
        </div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      {/* Right side - register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-primary-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={100}
              className="mx-auto"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Registrace</h2>
            <p className="text-gray-600">
              Vytvořte si účet a začněte používat aplikaci
            </p>
          </div>

          <div className="card-solid">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
                      className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                        role === r
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
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
                      <span className={`font-semibold ${role === r ? 'text-primary-700' : 'text-gray-700'}`}>
                        {roleLabels[r]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {role === 'client' && (
                <div className="animate-fade-in">
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
                  <p className="mt-2 text-sm text-gray-500">
                    Kód vám poskytne váš trenér
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3.5 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registruji...
                  </span>
                ) : (
                  'Vytvořit účet'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Již máte účet?{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Přihlaste se
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
