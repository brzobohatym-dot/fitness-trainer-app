import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PlanEditor from '@/components/plans/PlanEditor'

export const dynamic = 'force-dynamic'

interface PlanPageProps {
  params: {
    id: string
  }
}

export default async function PlanPage({ params }: PlanPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single() as { data: any | null }

  if (!plan) {
    notFound()
  }

  const { data: planExercises } = await supabase
    .from('plan_exercises')
    .select(
      `
      *,
      exercise:exercises(*)
    `
    )
    .eq('plan_id', params.id)
    .order('order_index') as { data: any[] | null }

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('trainer_id', user.id)
    .order('name') as { data: any[] | null }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Upravit plán: {plan.name}
        </h1>
        <Link
          href={`/plans/${params.id}/print`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Tisk PDF
        </Link>
      </div>
      <PlanEditor
        plan={plan}
        planExercises={planExercises || []}
        trainerId={user.id}
        availableExercises={exercises || []}
      />
    </div>
  )
}
