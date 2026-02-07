'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrainingPlan, PlanExercise, Exercise } from '@/types/database'
import ExerciseSelector from './ExerciseSelector'

interface PlanEditorProps {
  plan?: TrainingPlan
  planExercises?: (PlanExercise & { exercise: Exercise })[]
  trainerId: string
  availableExercises: Exercise[]
}

interface PlanExerciseItem {
  id?: string
  exercise_id: string
  exercise: Exercise
  order_index: number
  sets: number
  reps: string
  rest_seconds: number
  notes: string
}

export default function PlanEditor({
  plan,
  planExercises = [],
  trainerId,
  availableExercises,
}: PlanEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState(false)

  const [name, setName] = useState(plan?.name || '')
  const [description, setDescription] = useState(plan?.description || '')
  const [isTemplate, setIsTemplate] = useState(plan?.is_template || false)
  const [exercises, setExercises] = useState<PlanExerciseItem[]>(
    planExercises.map((pe, index) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      exercise: pe.exercise,
      order_index: index,
      sets: pe.sets,
      reps: pe.reps,
      rest_seconds: pe.rest_seconds,
      notes: pe.notes || '',
    }))
  )

  const addExercise = (exercise: Exercise) => {
    setExercises([
      ...exercises,
      {
        exercise_id: exercise.id,
        exercise,
        order_index: exercises.length,
        sets: 3,
        reps: '10',
        rest_seconds: 60,
        notes: '',
      },
    ])
    setShowSelector(false)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (
    index: number,
    field: keyof PlanExerciseItem,
    value: string | number
  ) => {
    setExercises(
      exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    )
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= exercises.length) return

    const newExercises = [...exercises]
    const temp = newExercises[index]
    newExercises[index] = newExercises[newIndex]
    newExercises[newIndex] = temp
    setExercises(newExercises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let planId = plan?.id

      if (plan) {
        const { error } = await (supabase
          .from('training_plans') as any)
          .update({
            name,
            description: description || null,
            is_template: isTemplate,
          })
          .eq('id', plan.id)

        if (error) throw error

        // Delete existing plan exercises
        await (supabase.from('plan_exercises') as any).delete().eq('plan_id', plan.id)
      } else {
        const { data, error } = await (supabase
          .from('training_plans') as any)
          .insert({
            name,
            description: description || null,
            is_template: isTemplate,
            trainer_id: trainerId,
          })
          .select()
          .single()

        if (error) throw error
        planId = data.id
      }

      // Insert plan exercises
      if (exercises.length > 0 && planId) {
        const { error } = await (supabase.from('plan_exercises') as any).insert(
          exercises.map((ex, index) => ({
            plan_id: planId!,
            exercise_id: ex.exercise_id,
            order_index: index,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes || null,
          }))
        )

        if (error) throw error
      }

      router.push('/plans')
      router.refresh()
    } catch (err) {
      setError('Chyba při ukládání plánu')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!plan) return
    if (!confirm('Opravdu chcete smazat tento plán?')) return

    setLoading(true)
    const supabase = createClient()

    // Delete plan exercises first
    await (supabase.from('plan_exercises') as any).delete().eq('plan_id', plan.id)

    const { error } = await (supabase
      .from('training_plans') as any)
      .delete()
      .eq('id', plan.id)

    if (error) {
      setError('Chyba při mazání plánu')
      setLoading(false)
      return
    }

    router.push('/plans')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Základní informace
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="label">
                Název plánu *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input mt-1"
                placeholder="např. Silový trénink - začátečníci"
                required
              />
            </div>

            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Uložit jako šablonu
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="label">
              Popis
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input mt-1 h-24"
              placeholder="Popište účel a cíle tohoto plánu..."
            />
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Cviky v plánu ({exercises.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowSelector(true)}
              className="btn btn-secondary"
            >
              + Přidat cvik
            </button>
          </div>

          {exercises.length > 0 ? (
            <div className="space-y-4">
              {exercises.map((ex, index) => (
                <div
                  key={`${ex.exercise_id}-${index}`}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <span className="text-center text-sm font-medium text-gray-500">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {ex.exercise.name}
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <label className="text-xs text-gray-500">Série</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) =>
                              updateExercise(index, 'sets', parseInt(e.target.value))
                            }
                            className="input mt-1"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">
                            Opakování
                          </label>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) =>
                              updateExercise(index, 'reps', e.target.value)
                            }
                            className="input mt-1"
                            placeholder="10 nebo 30s"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">
                            Pauza (s)
                          </label>
                          <input
                            type="number"
                            value={ex.rest_seconds}
                            onChange={(e) =>
                              updateExercise(
                                index,
                                'rest_seconds',
                                parseInt(e.target.value)
                              )
                            }
                            className="input mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">
                            Poznámka
                          </label>
                          <input
                            type="text"
                            value={ex.notes}
                            onChange={(e) =>
                              updateExercise(index, 'notes', e.target.value)
                            }
                            className="input mt-1"
                            placeholder="Volitelné"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Zatím jste nepřidali žádné cviky. Klikněte na tlačítko výše pro
              přidání.
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Ukládám...' : plan ? 'Uložit změny' : 'Vytvořit plán'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            Zrušit
          </button>
          {plan && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-danger ml-auto"
            >
              Smazat plán
            </button>
          )}
        </div>
      </form>

      {showSelector && (
        <ExerciseSelector
          exercises={availableExercises}
          onSelect={addExercise}
          onClose={() => setShowSelector(false)}
          excludeIds={exercises.map((e) => e.exercise_id)}
        />
      )}
    </div>
  )
}
