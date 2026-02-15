'use client'

import { useState, useEffect, useRef } from 'react'
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

interface SetLog {
  weight: string
  reps: string
  saved: boolean
}

interface ExerciseLogs {
  [exerciseId: string]: SetLog[]
}

interface TimerState {
  isRunning: boolean
  timeLeft: number
  totalTime: number
}

interface ExerciseTimers {
  [exerciseId: string]: TimerState
}

export default function ClientPlanView({ plan, planExercises, clientId }: ClientPlanViewProps) {
  const [showWorkout, setShowWorkout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({})
  const [savingSet, setSavingSet] = useState<string | null>(null)
  const [timers, setTimers] = useState<ExerciseTimers>({})
  const timerIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Timer functions
  const startTimer = (exerciseId: string, restSeconds: number) => {
    // Clear any existing interval
    if (timerIntervals.current[exerciseId]) {
      clearInterval(timerIntervals.current[exerciseId])
    }

    const totalTime = restSeconds
    setTimers(prev => ({
      ...prev,
      [exerciseId]: {
        isRunning: true,
        timeLeft: totalTime,
        totalTime: totalTime,
      }
    }))

    timerIntervals.current[exerciseId] = setInterval(() => {
      setTimers(prev => {
        const current = prev[exerciseId]
        if (!current || current.timeLeft <= 1) {
          clearInterval(timerIntervals.current[exerciseId])
          // Play sound when timer ends
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYFVLPa3LSTAAMfpc/RrYwLCABqvsnAjTgLGgBPq8LDl0gJGABCo73Gl08IFQBBn7rBmFIHEQBAnLm9l1UIEQBAnLa6l1cHEQBAm7S4l1gHEQBAmrK2l1kHEQBAmLC0l1oHEABAmK6yl1sHEABAlqywl1wHEABAlKuul10HDwBAlKmsl14HDwBAlKeql18HDgBAlKWol2AHDgBAlKSnl2EHDQBAlKKll2IHDQBAlKCjl2MHDABAk56hl2QHDABAk5yfl2UHCwBAk5qdl2YHCwBAk5ibl2cHCgBAk5aZl2gHCgBAk5SXl2kHCQBAk5KVl2oHCQBAk5CTl2sHCABAk46Rl2wHCABAk4yPl20HBwBAk4qNl24HBwBAk4iLl28HBgBAk4aJl3AHBgBAk4SHl3EHBQBAk4KFl3IHBQBAk4CDl3MHBABAkn6Bl3QHBABAknx/l3UHAwBAknp9l3YHAwBAknh7l3cHAgBAknZ5l3gHAgBAknR3l3kHAQBAknJ1l3oHAQBAkHBzl3sH')
            audio.play()
          } catch (e) {
            // Ignore audio errors
          }
          return {
            ...prev,
            [exerciseId]: {
              ...current,
              isRunning: false,
              timeLeft: 0,
            }
          }
        }
        return {
          ...prev,
          [exerciseId]: {
            ...current,
            timeLeft: current.timeLeft - 1,
          }
        }
      })
    }, 1000)
  }

  const stopTimer = (exerciseId: string) => {
    if (timerIntervals.current[exerciseId]) {
      clearInterval(timerIntervals.current[exerciseId])
    }
    setTimers(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        isRunning: false,
      }
    }))
  }

  const resetTimer = (exerciseId: string, restSeconds: number) => {
    if (timerIntervals.current[exerciseId]) {
      clearInterval(timerIntervals.current[exerciseId])
    }
    setTimers(prev => ({
      ...prev,
      [exerciseId]: {
        isRunning: false,
        timeLeft: restSeconds,
        totalTime: restSeconds,
      }
    }))
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals.current).forEach(interval => {
        clearInterval(interval)
      })
    }
  }, [])

  // Initialize logs for an exercise
  const initializeExerciseLogs = (exerciseId: string, sets: number) => {
    if (!exerciseLogs[exerciseId]) {
      const initialSets: SetLog[] = Array(sets).fill(null).map(() => ({
        weight: '',
        reps: '',
        saved: false,
      }))
      setExerciseLogs(prev => ({
        ...prev,
        [exerciseId]: initialSets,
      }))
    }
  }

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

      // Initialize exercise logs
      planExercises.forEach(pe => {
        initializeExerciseLogs(pe.id, pe.sets)
      })
    }

    setLoading(false)
  }

  const updateSetLog = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseLogs(prev => {
      const exerciseSets = [...(prev[exerciseId] || [])]
      if (exerciseSets[setIndex]) {
        exerciseSets[setIndex] = {
          ...exerciseSets[setIndex],
          [field]: value,
        }
      }
      return {
        ...prev,
        [exerciseId]: exerciseSets,
      }
    })
  }

  const saveSet = async (exerciseId: string, setIndex: number) => {
    if (!workoutLogId) return

    const setLog = exerciseLogs[exerciseId]?.[setIndex]
    if (!setLog || !setLog.weight) return

    setSavingSet(`${exerciseId}-${setIndex}`)
    const supabase = createClient()

    const { error } = await (supabase.from('exercise_logs') as any).insert({
      workout_log_id: workoutLogId,
      plan_exercise_id: exerciseId,
      set_number: setIndex + 1,
      weight: parseFloat(setLog.weight) || 0,
      reps_completed: setLog.reps ? parseInt(setLog.reps) : null,
    })

    if (!error) {
      setExerciseLogs(prev => {
        const exerciseSets = [...(prev[exerciseId] || [])]
        exerciseSets[setIndex] = {
          ...exerciseSets[setIndex],
          saved: true,
        }
        return {
          ...prev,
          [exerciseId]: exerciseSets,
        }
      })
    }

    setSavingSet(null)
  }

  const isExerciseComplete = (exerciseId: string, totalSets: number): boolean => {
    const logs = exerciseLogs[exerciseId]
    if (!logs) return false
    return logs.filter(log => log.saved).length === totalSets
  }

  const getCompletedSetsCount = (exerciseId: string): number => {
    const logs = exerciseLogs[exerciseId]
    if (!logs) return 0
    return logs.filter(log => log.saved).length
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

  const totalExercises = planExercises.length
  const completedExercises = planExercises.filter(pe => isExerciseComplete(pe.id, pe.sets)).length

  return (
    <div>
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h1>
            {plan.description && (
              <p className="text-gray-600">{plan.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="bg-primary-100 text-primary-700 px-4 py-2 rounded-xl">
              <span className="text-2xl font-bold">{completedExercises}/{totalExercises}</span>
              <span className="block text-xs">cviků hotovo</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedExercises / totalExercises) * 100}%` }}
          />
        </div>
      </div>

      {planExercises && planExercises.length > 0 ? (
        <div className="space-y-4">
          {planExercises.map((pe: any, index: number) => {
            const exerciseComplete = isExerciseComplete(pe.id, pe.sets)
            const completedSets = getCompletedSetsCount(pe.id)

            // Initialize logs if not done
            if (!exerciseLogs[pe.id]) {
              initializeExerciseLogs(pe.id, pe.sets)
            }

            return (
              <div
                key={pe.id}
                className={`card transition-all ${exerciseComplete ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    exerciseComplete ? 'bg-green-500' : 'bg-primary-100'
                  }`}>
                    {exerciseComplete ? (
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="font-bold text-primary-600 text-lg">
                        {getExerciseLabel(planExercises, index)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pe.exercise.name}
                      </h3>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        exerciseComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {completedSets}/{pe.sets} sérií
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {(exerciseTypeLabels as Record<string, string>)[pe.exercise.exercise_type]}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {(muscleGroupLabels as Record<string, string>)[pe.exercise.muscle_group]}
                      </span>
                    </div>

                    {/* Target info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Cíl:</span> {pe.sets} sérií × {pe.reps} opakování, pauza {pe.rest_seconds}s
                      </p>
                    </div>

                    {/* Rest Timer */}
                    {(() => {
                      const timer = timers[pe.id] || { isRunning: false, timeLeft: pe.rest_seconds, totalTime: pe.rest_seconds }
                      const progress = timer.totalTime > 0 ? ((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100 : 0
                      const isFinished = timer.timeLeft === 0 && !timer.isRunning && timers[pe.id]

                      return (
                        <div className={`rounded-xl p-4 mb-4 ${isFinished ? 'bg-green-100 border-2 border-green-400' : 'bg-primary-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Stopky na pauzu</span>
                            <span className={`text-2xl font-bold ${isFinished ? 'text-green-600' : 'text-primary-600'}`}>
                              {formatTime(timer.timeLeft)}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${isFinished ? 'bg-green-500' : 'bg-primary-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="flex gap-2">
                            {!timer.isRunning ? (
                              <button
                                type="button"
                                onClick={() => startTimer(pe.id, timer.timeLeft > 0 ? timer.timeLeft : pe.rest_seconds)}
                                className="flex-1 btn btn-primary py-2 text-sm"
                              >
                                {isFinished ? 'Start znovu' : 'Start'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => stopTimer(pe.id)}
                                className="flex-1 btn btn-secondary py-2 text-sm"
                              >
                                Stop
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => resetTimer(pe.id, pe.rest_seconds)}
                              className="btn btn-secondary py-2 px-4 text-sm"
                            >
                              Reset
                            </button>
                          </div>

                          {isFinished && (
                            <p className="text-center text-green-600 font-medium mt-2 text-sm">
                              Pauza dokončena! Můžeš pokračovat.
                            </p>
                          )}
                        </div>
                      )
                    })()}

                    {/* Sets input */}
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-gray-700">Zaznamenej váhy:</p>
                      {Array.from({ length: pe.sets }).map((_, setIndex) => {
                        const setLog = exerciseLogs[pe.id]?.[setIndex] || { weight: '', reps: '', saved: false }
                        const isSaving = savingSet === `${pe.id}-${setIndex}`

                        return (
                          <div
                            key={setIndex}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              setLog.saved ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              setLog.saved
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {setLog.saved ? '✓' : setIndex + 1}
                            </span>

                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  placeholder="Váha (kg)"
                                  value={setLog.weight}
                                  onChange={(e) => updateSetLog(pe.id, setIndex, 'weight', e.target.value)}
                                  disabled={setLog.saved}
                                  className={`input py-2 text-center ${setLog.saved ? 'bg-green-100 border-green-200' : ''}`}
                                  step="0.5"
                                  min="0"
                                />
                              </div>
                              <span className="text-gray-400">×</span>
                              <div className="w-20">
                                <input
                                  type="number"
                                  placeholder={pe.reps}
                                  value={setLog.reps}
                                  onChange={(e) => updateSetLog(pe.id, setIndex, 'reps', e.target.value)}
                                  disabled={setLog.saved}
                                  className={`input py-2 text-center ${setLog.saved ? 'bg-green-100 border-green-200' : ''}`}
                                  min="0"
                                />
                              </div>
                            </div>

                            {!setLog.saved ? (
                              <button
                                onClick={() => saveSet(pe.id, setIndex)}
                                disabled={!setLog.weight || isSaving}
                                className="btn btn-primary py-2 px-4 disabled:opacity-50"
                              >
                                {isSaving ? '...' : 'OK'}
                              </button>
                            ) : (
                              <span className="text-green-600 font-medium px-4">Hotovo</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {pe.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Poznámka:</strong> {pe.notes}
                        </p>
                      </div>
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
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Tento plán zatím neobsahuje žádné cviky</p>
        </div>
      )}

      {completedExercises === totalExercises && totalExercises > 0 && (
        <div className="card mt-6 bg-green-50 border-green-200 text-center py-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Trénink dokončen!</h2>
          <p className="text-green-600 mb-6">Skvělá práce! Všechny cviky jsou splněny.</p>

          {/* Total weight stats */}
          <div className="bg-white rounded-xl p-6 max-w-sm mx-auto shadow-sm">
            <p className="text-gray-500 text-sm mb-2">Celkem nazvedáno</p>
            <p className="text-4xl font-bold text-primary-600">
              {(() => {
                let totalWeight = 0
                planExercises.forEach(pe => {
                  const logs = exerciseLogs[pe.id]
                  if (logs) {
                    logs.forEach(setLog => {
                      if (setLog.saved && setLog.weight) {
                        const weight = parseFloat(setLog.weight) || 0
                        // Use entered reps, or target reps from plan
                        const reps = parseInt(setLog.reps) || parseInt(pe.reps) || 1
                        totalWeight += weight * reps
                      }
                    })
                  }
                })
                return totalWeight.toLocaleString('cs-CZ')
              })()}
              <span className="text-xl font-normal text-gray-500 ml-1">kg</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
