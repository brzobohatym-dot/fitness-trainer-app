'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PreWorkoutForm from './PreWorkoutForm'
import YouTubeEmbed from '@/components/exercises/YouTubeEmbed'
import {
  exerciseTypeLabels,
  muscleGroupLabels,
  difficultyLabels,
} from '@/types/database'

interface ClientPlanViewProps {
  plan: any
  planExercises: any[]
  clientId: string
}

// Calculate display label like A1, A2, B1, etc.
function getExerciseLabel(exercises: any[], index: number): string {
  const currentExercise = exercises[index]
  const group = currentExercise.group_label || 'A'

  let numberInGroup = 1
  for (let i = 0; i < index; i++) {
    if ((exercises[i].group_label || 'A') === group) {
      numberInGroup++
    }
  }

  return `${group}${numberInGroup}`
}

export default function ClientPlanView({ plan, planExercises, clientId }: ClientPlanViewProps) {
  const [showWorkout, setShowWorkout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)

  const handlePreWorkoutSubmit = async (data: {
    fatigue_level: number
    muscle_pain: number
    mood: number
    notes: string
  }) => {
    setLoading(true)
    const supabase = createClient()

    const { data: logData, error } = await (supabase.from('workout_logs') as any).insert({
      client_id: clientId,
      plan_id: plan.id,
      fatigue_level: data.fatigue_level,
      muscle_pain: data.muscle_pain,
      mood: data.mood,
      notes: data.notes || null,
    }).select().single()

    if (!error && logData) {
      setWorkoutLogId(logData.id)
      setShowWorkout(true)
    }

    setLoading(false)
  }

  if (!showWorkout) {
    return (
      <div className="py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.name}
          </h1>
          {plan.description && (
            <p className="text-gray-600">{plan.description}</p>
          )}
        </div>
        <PreWorkoutForm onSubmit={handlePreWorkoutSubmit} loading={loading} />
      </div>
    )
  }

  return (
    <div>
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h1>
            {plan.description && (
              <p className="text-gray-600">{plan.description}</p>
            )}
          </div>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            Trénink zahájen
          </div>
        </div>
      </div>

      {planExercises && planExercises.length > 0 ? (
        <div className="space-y-4">
          {planExercises.map((pe: any, index: number) => (
            <div key={pe.id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="font-bold text-primary-600 text-lg">
                    {getExerciseLabel(planExercises, index)}
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
  )
}
