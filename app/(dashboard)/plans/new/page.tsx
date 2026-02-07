import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanEditor from '@/components/plans/PlanEditor'

export default async function NewPlanPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('trainer_id', user.id)
    .order('name')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nový plán</h1>
      <PlanEditor trainerId={user.id} availableExercises={exercises || []} />
    </div>
  )
}
