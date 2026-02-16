import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function ClientLayout({
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

  if (profile?.role !== 'client') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-100">
        <main className="flex-1 p-8 animate-fade-in">{children}</main>
        <footer className="p-4 text-center text-sm text-primary-400 border-t border-primary-100 bg-white/50 backdrop-blur-sm">
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
