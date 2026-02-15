'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, TrainingPlan, ClientPlan } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface ClientPageProps {
  params: {
    id: string
  }
}

interface WorkoutLogWithDetails {
  id: string
  plan_id: string
  fatigue_level: number
  muscle_pain: number
  mood: number
  notes: string | null
  created_at: string
  plan?: { name: string }
  exercise_logs?: {
    id: string
    set_number: number
    weight: number
    reps_completed: number | null
    plan_exercise?: {
      reps: string
      exercise?: { name: string }
    }
  }[]
}

export default function ClientPage({ params }: ClientPageProps) {
  const router = useRouter()
  const [client, setClient] = useState<Profile | null>(null)
  const [trainer, setTrainer] = useState<Profile | null>(null)
  const [clientPlans, setClientPlans] = useState<(ClientPlan & { plan: TrainingPlan })[]>([])
  const [availablePlans, setAvailablePlans] = useState<TrainingPlan[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientResult, plansResult, clientPlansResult, trainerResult, workoutLogsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .eq('trainer_id', user.id)
        .single(),
      supabase
        .from('training_plans')
        .select('*')
        .eq('trainer_id', user.id)
        .order('name'),
      supabase
        .from('client_plans')
        .select('*, plan:training_plans(*)')
        .eq('client_id', params.id)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('workout_logs')
        .select(`
          *,
          plan:training_plans(name),
          exercise_logs(
            id,
            set_number,
            weight,
            reps_completed,
            plan_exercise:plan_exercises(
              reps,
              exercise:exercises(name)
            )
          )
        `)
        .eq('client_id', params.id)
        .order('created_at', { ascending: false }),
    ])

    setClient(clientResult.data)
    setTrainer(trainerResult.data)
    setAvailablePlans(plansResult.data || [])
    setClientPlans((clientPlansResult.data as any) || [])
    setWorkoutLogs((workoutLogsResult.data as any) || [])
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanId) return

    setAssigning(true)
    setEmailStatus('idle')
    const supabase = createClient()

    const { error } = await supabase.from('client_plans').insert({
      plan_id: selectedPlanId,
      client_id: params.id,
      start_date: startDate || null,
      end_date: endDate || null,
    } as any)

    if (!error) {
      // Get the selected plan name
      const selectedPlan = availablePlans.find(p => p.id === selectedPlanId)

      // Send email notification if client has email
      if (client?.email && selectedPlan) {
        setEmailStatus('sending')
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: client.email,
              clientName: client.full_name || 'Klient',
              planName: selectedPlan.name,
              trainerName: trainer?.full_name,
            }),
          })

          if (response.ok) {
            setEmailStatus('sent')
          } else {
            setEmailStatus('error')
          }
        } catch {
          setEmailStatus('error')
        }
      }

      setShowAssignForm(false)
      setSelectedPlanId('')
      setStartDate('')
      setEndDate('')
      loadData()
    }

    setAssigning(false)
  }

  const handleRemovePlan = async (clientPlanId: string) => {
    if (!confirm('Opravdu chcete odebrat tento plán?')) return

    const supabase = createClient()
    await supabase.from('client_plans').delete().eq('id', clientPlanId)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Načítám...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Klient nenalezen</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← Zpět na seznam klientů
      </button>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-2xl">
              {client.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.full_name || 'Bez jména'}
            </h1>
            <p className="text-gray-500">
              Klient od: {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Přiřazené plány ({clientPlans.length})
          </h2>
          <button
            onClick={() => setShowAssignForm(true)}
            className="btn btn-primary"
          >
            + Přiřadit plán
          </button>
        </div>

        {showAssignForm && (
          <form
            onSubmit={handleAssignPlan}
            className="bg-gray-50 rounded-lg p-4 mb-4"
          >
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="label">Plán</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="input mt-1"
                  required
                >
                  <option value="">Vyberte plán</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Od</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label">Do</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={assigning}
                  className="btn btn-primary"
                >
                  {assigning ? 'Přiřazuji...' : 'Přiřadit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="btn btn-secondary"
                >
                  Zrušit
                </button>
              </div>
            </div>
            {!client?.email && (
              <p className="text-sm text-amber-600 mt-3">
                Klient nemá nastaven email - upozornění nebude odesláno.
              </p>
            )}
          </form>
        )}

        {emailStatus === 'sent' && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Email s upozorněním byl úspěšně odeslán klientovi.
          </div>
        )}

        {emailStatus === 'error' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nepodařilo se odeslat email s upozorněním.
          </div>
        )}

        {clientPlans.length > 0 ? (
          <div className="space-y-3">
            {clientPlans.map((cp) => (
              <div
                key={cp.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{cp.plan?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Přiřazeno: {formatDate(cp.assigned_at)}
                    {cp.start_date && ` • Od: ${cp.start_date}`}
                    {cp.end_date && ` • Do: ${cp.end_date}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRemovePlan(cp.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Odebrat
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Tomuto klientovi zatím není přiřazen žádný plán
          </p>
        )}
      </div>

      {/* Workout History */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historie tréninků ({workoutLogs.length})
        </h2>

        {workoutLogs.length > 0 ? (
          <div className="space-y-4">
            {workoutLogs.map((log) => {
              const isExpanded = expandedWorkout === log.id
              const totalWeight = log.exercise_logs?.reduce((sum, el) => {
                const reps = el.reps_completed || parseInt(el.plan_exercise?.reps || '1') || 1
                return sum + (el.weight * reps)
              }, 0) || 0

              const getRatingColor = (value: number) => {
                if (value <= 2) return 'bg-green-100 text-green-700'
                if (value === 3) return 'bg-yellow-100 text-yellow-700'
                return 'bg-red-100 text-red-700'
              }

              return (
                <div key={log.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedWorkout(isExpanded ? null : log.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{log.plan?.name || 'Trénink'}</h3>
                        <p className="text-sm text-gray-500">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(log.fatigue_level)}`}>
                          Únava: {log.fatigue_level}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(log.muscle_pain)}`}>
                          Bolest: {log.muscle_pain}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(log.mood)}`}>
                          Nálada: {log.mood}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">{totalWeight.toLocaleString('cs-CZ')} kg</p>
                        <p className="text-xs text-gray-500">celkem</p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {log.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Poznámka klienta:</strong> {log.notes}
                          </p>
                        </div>
                      )}

                      {log.exercise_logs && log.exercise_logs.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Záznamy cviků:</p>
                          {(() => {
                            // Group by exercise
                            const grouped: { [key: string]: typeof log.exercise_logs } = {}
                            log.exercise_logs?.forEach(el => {
                              const name = el.plan_exercise?.exercise?.name || 'Cvik'
                              if (!grouped[name]) grouped[name] = []
                              grouped[name]!.push(el)
                            })

                            return Object.entries(grouped).map(([exerciseName, sets]) => (
                              <div key={exerciseName} className="bg-white rounded-lg p-3 border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">{exerciseName}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {sets?.sort((a, b) => a.set_number - b.set_number).map(set => (
                                    <span
                                      key={set.id}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700"
                                    >
                                      {set.set_number}. série: {set.weight} kg × {set.reps_completed || '?'} op.
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Žádné záznamy cviků</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Tento klient zatím nemá žádné záznamy tréninků
          </p>
        )}
      </div>
    </div>
  )
}
