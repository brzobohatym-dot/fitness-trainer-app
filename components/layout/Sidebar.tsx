'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

interface SidebarProps {
  profile: Profile | null
}

const trainerLinks = [
  { href: '/dashboard', label: 'Přehled', icon: '📊' },
  { href: '/exercises', label: 'Cviky', icon: '🏋️' },
  { href: '/plans', label: 'Plány', icon: '📋' },
  { href: '/clients', label: 'Klienti', icon: '👥' },
]

const clientLinks = [
  { href: '/dashboard', label: 'Přehled', icon: '📊' },
  { href: '/client', label: 'Moje plány', icon: '📋' },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = profile?.role === 'trainer' ? trainerLinks : clientLinks

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="text-xl font-bold text-primary-600">
          FitTrainer
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-2 mb-2">
          <p className="font-medium text-gray-900">{profile?.full_name}</p>
          <p className="text-sm text-gray-500">
            {profile?.role === 'trainer' ? 'Trenér' : 'Klient'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Odhlásit se
        </button>
      </div>
    </aside>
  )
}
