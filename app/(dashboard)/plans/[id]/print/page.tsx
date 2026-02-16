'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrainingPlan, PlanExercise, Exercise, muscleGroupLabels } from '@/types/database'

interface PlanExerciseWithExercise extends PlanExercise {
  exercise: Exercise
}

export default function PrintPlanPage() {
  const params = useParams()
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [exercises, setExercises] = useState<PlanExerciseWithExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: planData } = await supabase
        .from('training_plans')
        .select('*')
        .eq('id', params.id)
        .single()

      if (planData) {
        setPlan(planData as TrainingPlan)

        const { data: exercisesData } = await supabase
          .from('plan_exercises')
          .select(`
            *,
            exercise:exercises(*)
          `)
          .eq('plan_id', params.id)
          .order('order_index')

        setExercises((exercisesData as PlanExerciseWithExercise[]) || [])
      }

      setLoading(false)
    }

    loadData()
  }, [params.id])

  useEffect(() => {
    if (!loading && plan) {
      // Auto-print after loading
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [loading, plan])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Plán nebyl nalezen</p>
      </div>
    )
  }

  // Group exercises by group_label
  const groupedExercises: { [key: string]: PlanExerciseWithExercise[] } = {}
  exercises.forEach(ex => {
    const group = ex.group_label || 'Ostatní'
    if (!groupedExercises[group]) {
      groupedExercises[group] = []
    }
    groupedExercises[group].push(ex)
  })

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
        @page {
          margin: 1.5cm;
          size: A4;
        }
      `}</style>

      {/* Print button - hidden when printing */}
      <div className="no-print fixed top-4 right-4 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Vytisknout
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Zavřít
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
          {plan.description && (
            <p className="text-gray-600 mt-2">{plan.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            Vytištěno: {new Date().toLocaleDateString('cs-CZ')}
          </p>
        </div>

        {/* Exercises by group */}
        {Object.entries(groupedExercises).map(([groupName, groupExercises], groupIndex) => (
          <div key={groupName} className={groupIndex > 0 ? 'mt-8' : ''}>
            <h2 className="text-xl font-bold text-gray-800 bg-gray-100 px-4 py-2 rounded">
              {groupName}
            </h2>

            <table className="w-full mt-4 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">#</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Cvik</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Svalová skupina</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Série</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Opakování</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Odpočinek</th>
                </tr>
              </thead>
              <tbody>
                {groupExercises.map((ex, index) => (
                  <tr key={ex.id} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                    <td className="py-3 px-2">
                      <p className="font-medium text-gray-900">{ex.exercise.name}</p>
                      {ex.notes && (
                        <p className="text-sm text-gray-500 mt-1">{ex.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {muscleGroupLabels[ex.exercise.muscle_group as keyof typeof muscleGroupLabels]}
                    </td>
                    <td className="py-3 px-2 text-center font-medium">{ex.sets}</td>
                    <td className="py-3 px-2 text-center font-medium">{ex.reps}</td>
                    <td className="py-3 px-2 text-center text-gray-600">{ex.rest_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Notes section for writing */}
        <div className="mt-10 pt-6 border-t-2 border-gray-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Poznámky</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="border-b border-gray-200 pb-3">
                <div className="h-6"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>Kondičák - Fitness Trainer App</p>
        </div>
      </div>
    </>
  )
}
