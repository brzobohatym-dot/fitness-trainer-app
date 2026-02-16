import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgressCharts from '@/components/client/ProgressCharts'

export const dynamic = 'force-dynamic'

export default async function ClientProgressPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all exercise logs for this client
  const { data: exerciseLogs } = await supabase
    .from('exercise_logs')
    .select(`
      *,
      workout_log:workout_logs!inner(client_id),
      plan_exercise:plan_exercises(
        exercise:exercises(*)
      )
    `)
    .eq('workout_log.client_id', user.id)
    .order('created_at', { ascending: true })

  // Get unique exercises the client has trained
  const exerciseIds = Array.from(new Set(
    (exerciseLogs || [])
      .map(log => (log as any).plan_exercise?.exercise?.id)
      .filter(Boolean)
  ))

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .in('id', exerciseIds.length > 0 ? exerciseIds : ['00000000-0000-0000-0000-000000000000'])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Progres a statistiky
      </h1>

      <ProgressCharts
        exerciseLogs={(exerciseLogs as any) || []}
        exercises={exercises || []}
      />
    </div>
  )
}
