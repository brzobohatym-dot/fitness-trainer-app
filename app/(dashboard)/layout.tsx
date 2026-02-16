import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: any }

  // Check if trainer is approved
  if (profile?.role === 'trainer' && !profile?.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 p-4">
        <div className="max-w-md w-full text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={200}
            height={100}
            className="mx-auto mb-8"
          />
          <div className="card-solid">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Čeká se na schválení
            </h1>
            <p className="text-gray-600 mb-6">
              Váš účet trenéra čeká na schválení administrátorem.
              Jakmile bude váš účet schválen, budete moci používat aplikaci.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Registrováno: {profile?.full_name || profile?.email}
            </p>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="btn btn-secondary w-full"
              >
                Odhlásit se
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar profile={profile} />
      </div>

      {/* Mobile Navigation */}
      <MobileNav profile={profile} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-100 min-h-screen">
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 animate-fade-in">{children}</main>
        <footer className="hidden lg:block p-4 text-center text-sm text-primary-400 border-t border-primary-100 bg-white/50 backdrop-blur-sm">
          <a
            href="https://www.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-600 transition-colors"
          >
            www.example.com
          </a>
        </footer>
      </div>
    </div>
  )
}
