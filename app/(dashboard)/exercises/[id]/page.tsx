import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExerciseForm from '@/components/exercises/ExerciseForm'

export const dynamic = 'force-dynamic'

interface ExercisePageProps {
  params: {
    id: string
  }
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single() as { data: any | null }

  if (!exercise) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        <span className="block text-sm font-normal text-gray-500 mb-0.5">Upravit cvik</span>
        {exercise.name}
      </h1>
      <div className="card">
        <ExerciseForm exercise={exercise} trainerId={user.id} />
      </div>
    </div>
  )
}
