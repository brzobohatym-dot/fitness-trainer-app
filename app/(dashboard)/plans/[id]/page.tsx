import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanEditor from '@/components/plans/PlanEditor'

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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Upravit plán: {plan.name}
      </h1>
      <PlanEditor
        plan={plan}
        planExercises={planExercises || []}
        trainerId={user.id}
        availableExercises={exercises || []}
      />
    </div>
  )
}
