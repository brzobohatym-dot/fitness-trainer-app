import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single() as { data: any | null }

  if (profile?.role === 'client') {
    return <ClientDashboard userId={userId} />
  }

  return <TrainerDashboard trainerId={userId} />
}

async function TrainerDashboard({ trainerId }: { trainerId: string }) {
  const supabase = createClient()

  const [exercisesResult, plansResult, clientsResult] = await Promise.all([
    supabase
      .from('exercises')
      .select('id', { count: 'exact' })
      .eq('trainer_id', trainerId),
    supabase
      .from('training_plans')
      .select('id', { count: 'exact' })
      .eq('trainer_id', trainerId),
    supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('trainer_id', trainerId),
  ])

  const stats = [
    {
      label: 'Cviky',
      value: exercisesResult.count || 0,
      href: '/exercises',
      icon: '🏋️',
    },
    {
      label: 'Plány',
      value: plansResult.count || 0,
      href: '/plans',
      icon: '📋',
    },
    {
      label: 'Klienti',
      value: clientsResult.count || 0,
      href: '/clients',
      icon: '👥',
    },
  ]

  const { data: recentExercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false })
    .limit(5) as { data: any[] | null }

  const { data: recentPlans } = await supabase
    .from('training_plans')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false })
    .limit(5) as { data: any[] | null }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Přehled</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{stat.icon}</div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Poslední cviky
            </h2>
            <Link
              href="/exercises/new"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Přidat cvik
            </Link>
          </div>
          {recentExercises && recentExercises.length > 0 ? (
            <ul className="space-y-3">
              {recentExercises.map((exercise) => (
                <li key={exercise.id}>
                  <Link
                    href={`/exercises/${exercise.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{exercise.name}</p>
                    <p className="text-sm text-gray-500">
                      {exercise.muscle_group} • {exercise.difficulty}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Zatím nemáte žádné cviky</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Poslední plány
            </h2>
            <Link
              href="/plans/new"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Vytvořit plán
            </Link>
          </div>
          {recentPlans && recentPlans.length > 0 ? (
            <ul className="space-y-3">
              {recentPlans.map((plan) => (
                <li key={plan.id}>
                  <Link
                    href={`/plans/${plan.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500">
                      {plan.is_template ? 'Šablona' : 'Plán'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Zatím nemáte žádné plány</p>
          )}
        </div>
      </div>
    </div>
  )
}

async function ClientDashboard({ userId }: { userId: string }) {
  const supabase = createClient()

  const { data: clientPlans } = await supabase
    .from('client_plans')
    .select(
      `
      *,
      plan:training_plans(*)
    `
    )
    .eq('client_id', userId)
    .order('assigned_at', { ascending: false }) as { data: any[] | null }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Moje plány</h1>

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
                <p className="text-gray-600 text-sm mb-4">
                  {cp.plan.description}
                </p>
              )}
              <div className="text-sm text-gray-500">
                {cp.start_date && <span>Od: {cp.start_date}</span>}
                {cp.end_date && <span> Do: {cp.end_date}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">Zatím vám nebyl přiřazen žádný plán</p>
          <p className="text-sm text-gray-400">
            Kontaktujte svého trenéra pro přiřazení tréninkového plánu
          </p>
        </div>
      )}
    </div>
  )
}
