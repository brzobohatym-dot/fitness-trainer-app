import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { formatDate } from '@/lib/utils'

export default async function ClientHomePage() {
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
    .single() as { data: any | null }

  if (profile?.role !== 'client') {
    redirect('/dashboard')
  }

  const { data: clientPlans } = await supabase
    .from('client_plans')
    .select(
      `
      *,
      plan:training_plans(*)
    `
    )
    .eq('client_id', user.id)
    .order('assigned_at', { ascending: false }) as { data: any[] | null }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">FitTrainer</h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Odhlásit se
            </button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Moje tréninkové plány
        </h2>

        {clientPlans && clientPlans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientPlans.map((cp) => (
              <Link
                key={cp.id}
                href={`/client/plan/${cp.plan_id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cp.plan?.name}
                </h3>
                {cp.plan?.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {cp.plan.description}
                  </p>
                )}
                <div className="text-sm text-gray-500">
                  <p>Přiřazeno: {formatDate(cp.assigned_at)}</p>
                  {cp.start_date && <p>Od: {cp.start_date}</p>}
                  {cp.end_date && <p>Do: {cp.end_date}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-2">
              Zatím vám nebyl přiřazen žádný plán
            </p>
            <p className="text-sm text-gray-400">
              Kontaktujte svého trenéra pro přiřazení tréninkového plánu
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
