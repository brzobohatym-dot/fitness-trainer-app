'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrainingPlan, PlanExercise, Exercise } from '@/types/database'
import ExerciseSelector from './ExerciseSelector'
import YouTubeEmbed from '@/components/exercises/YouTubeEmbed'
import { getYouTubeThumbnail } from '@/lib/utils'

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
  group_label: string
  sets: number
  reps: string
  rest_seconds: number
  notes: string
}

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// Calculate display label like A1, A2, B1, etc.
function getExerciseLabel(exercises: PlanExerciseItem[], index: number): string {
  const currentExercise = exercises[index]
  const group = currentExercise.group_label

  // Count how many exercises with the same group come before this one
  let numberInGroup = 1
  for (let i = 0; i < index; i++) {
    if (exercises[i].group_label === group) {
      numberInGroup++
    }
  }

  return `${group}${numberInGroup}`
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

  const [expandedVideos, setExpandedVideos] = useState<Set<number>>(new Set())
  const [name, setName] = useState(plan?.name || '')
  const [description, setDescription] = useState(plan?.description || '')
  const [isTemplate, setIsTemplate] = useState(plan?.is_template || false)
  const [exercises, setExercises] = useState<PlanExerciseItem[]>(
    planExercises.map((pe, index) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      exercise: pe.exercise,
      order_index: index,
      group_label: pe.group_label || 'A',
      sets: pe.sets,
      reps: pe.reps,
      rest_seconds: pe.rest_seconds,
      notes: pe.notes || '',
    }))
  )

  const addExercise = (exercise: Exercise) => {
    // Use the last exercise's group label or 'A' for the first exercise
    const lastGroupLabel = exercises.length > 0
      ? exercises[exercises.length - 1].group_label
      : 'A'

    setExercises([
      ...exercises,
      {
        exercise_id: exercise.id,
        exercise,
        order_index: exercises.length,
        group_label: lastGroupLabel,
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
            group_label: ex.group_label,
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
                  className="border border-gray-200 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1 items-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-base sm:text-lg font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          {getExerciseLabel(exercises, index)}
                        </span>
                        <select
                          value={ex.group_label}
                          onChange={(e) => updateExercise(index, 'group_label', e.target.value)}
                          className="mt-1 text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                          title="Skupina cviku"
                        >
                          {GROUP_LABELS.map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900">
                          {ex.exercise.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="p-1 sm:p-2 text-red-500 hover:text-red-700 flex-shrink-0 -mr-1"
                        >
                          ✕
                        </button>
                      </div>

                      {ex.exercise.youtube_url && !expandedVideos.has(index) && (
                        <button
                          type="button"
                          onClick={() => setExpandedVideos(prev => new Set(prev).add(index))}
                          className="flex items-center gap-2 group mt-2"
                        >
                          <div className="relative w-20 h-12 sm:w-24 sm:h-14 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={getYouTubeThumbnail(ex.exercise.youtube_url) || ''}
                              alt={ex.exercise.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          <span className="text-xs text-primary-600 group-hover:text-primary-800">Přehrát video</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-3">
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
                  </div>

                  {/* Expanded video - full card width, outside the flex row */}
                  {ex.exercise.youtube_url && expandedVideos.has(index) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <YouTubeEmbed url={ex.exercise.youtube_url} title={ex.exercise.name} />
                      <button
                        type="button"
                        onClick={() => setExpandedVideos(prev => {
                          const next = new Set(prev)
                          next.delete(index)
                          return next
                        })}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                      >
                        Skrýt video
                      </button>
                    </div>
                  )}
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
