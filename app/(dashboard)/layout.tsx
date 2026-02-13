import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

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
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">{children}</main>
        <footer className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
          <a
            href="https://www.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-600"
          >
            www.example.com
          </a>
        </footer>
      </div>
    </div>
  )
}
