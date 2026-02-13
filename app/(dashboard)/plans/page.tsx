import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import PlanCard from '@/components/plans/PlanCard'

export default async function PlansPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || ''

  const { data: plans } = await supabase
    .from('training_plans')
    .select('*')
    .eq('trainer_id', userId)
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Get exercise counts for each plan
  const planIds = plans?.map((p: any) => p.id) || []
  const { data: exerciseCounts } = await supabase
    .from('plan_exercises')
    .select('plan_id')
    .in('plan_id', planIds.length > 0 ? planIds : ['none']) as { data: any[] | null }

  const countByPlan = (exerciseCounts || []).reduce((acc: Record<string, number>, pe: any) => {
    acc[pe.plan_id] = (acc[pe.plan_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const templates = plans?.filter((p) => p.is_template) || []
  const regularPlans = plans?.filter((p) => !p.is_template) || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tréninkové plány</h1>
        <Link href="/plans/new" className="btn btn-primary">
          + Vytvořit plán
        </Link>
      </div>

      {templates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Šablony</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                exerciseCount={countByPlan[plan.id] || 0}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plány</h2>
        {regularPlans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                exerciseCount={countByPlan[plan.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">Zatím nemáte žádné plány</p>
            <Link href="/plans/new" className="btn btn-primary">
              Vytvořit první plán
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
