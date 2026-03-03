import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExerciseForm from '@/components/exercises/ExerciseForm'

export const dynamic = 'force-dynamic'

export default async function NewExercisePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Nový cvik</h1>
      <div className="card">
        <ExerciseForm trainerId={user.id} />
      </div>
    </div>
  )
}
