import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ClientHomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clientPlans } = await supabase
    .from('client_plans')
    .select(`
      *,
      plan:training_plans(*)
    `)
    .eq('client_id', user.id)
    .order('assigned_at', { ascending: false }) as { data: any[] | null }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Moje tréninkové plány
      </h1>

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
    </div>
  )
}
