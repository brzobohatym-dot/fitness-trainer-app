import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import YouTubeEmbed from '@/components/exercises/YouTubeEmbed'
import {
  exerciseTypeLabels,
  muscleGroupLabels,
  difficultyLabels,
} from '@/types/database'

interface ClientPlanPageProps {
  params: {
    id: string
  }
}

export default async function ClientPlanPage({ params }: ClientPlanPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify client has access to this plan
  const { data: clientPlan } = await supabase
    .from('client_plans')
    .select('*')
    .eq('client_id', user.id)
    .eq('plan_id', params.id)
    .single() as { data: any | null }

  if (!clientPlan) {
    notFound()
  }

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('id', params.id)
    .single() as { data: any | null }

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

  if (!plan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/client"
            className="text-xl font-bold text-primary-600 hover:text-primary-700"
          >
            FitTrainer
          </Link>
          <Link
            href="/client"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Zpět na přehled
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="card mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h1>
            {plan.description && (
              <p className="text-gray-600">{plan.description}</p>
            )}
          </div>

          {planExercises && planExercises.length > 0 ? (
            <div className="space-y-4">
              {planExercises.map((pe: any, index: number) => (
                <div key={pe.id} className="card">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="font-semibold text-primary-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {pe.exercise.name}
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(exerciseTypeLabels as Record<string, string>)[pe.exercise.exercise_type]}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {(muscleGroupLabels as Record<string, string>)[pe.exercise.muscle_group]}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {(difficultyLabels as Record<string, string>)[pe.exercise.difficulty]}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-2xl font-bold text-gray-900">
                            {pe.sets}
                          </p>
                          <p className="text-sm text-gray-500">Série</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-2xl font-bold text-gray-900">
                            {pe.reps}
                          </p>
                          <p className="text-sm text-gray-500">Opakování</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-2xl font-bold text-gray-900">
                            {pe.rest_seconds}s
                          </p>
                          <p className="text-sm text-gray-500">Pauza</p>
                        </div>
                      </div>

                      {pe.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Poznámka:</strong> {pe.notes}
                          </p>
                        </div>
                      )}

                      {pe.exercise.description && (
                        <p className="text-gray-600 mb-4">
                          {pe.exercise.description}
                        </p>
                      )}

                      {pe.exercise.youtube_url && (
                        <YouTubeEmbed
                          url={pe.exercise.youtube_url}
                          title={pe.exercise.name}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">Tento plán zatím neobsahuje žádné cviky</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
