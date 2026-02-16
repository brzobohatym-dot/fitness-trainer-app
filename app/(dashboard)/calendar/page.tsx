'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScheduledWorkout, Profile, TrainingPlan, workoutStatusLabels } from '@/types/database'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  workouts: (ScheduledWorkout & { client?: Profile; plan?: TrainingPlan })[]
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workouts, setWorkouts] = useState<(ScheduledWorkout & { client?: Profile; plan?: TrainingPlan })[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    client_id: '',
    plan_id: '',
    scheduled_time: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [currentDate])

  const loadData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get start and end of month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Load scheduled workouts for this month
    const { data: workoutsData } = await supabase
      .from('scheduled_workouts')
      .select(`
        *,
        client:profiles!scheduled_workouts_client_id_fkey(*),
        plan:training_plans(*)
      `)
      .eq('trainer_id', user.id)
      .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
      .lte('scheduled_date', endOfMonth.toISOString().split('T')[0])
      .order('scheduled_date')

    // Load clients
    const { data: clientsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('trainer_id', user.id)
      .eq('role', 'client')

    // Load plans
    const { data: plansData } = await supabase
      .from('training_plans')
      .select('*')
      .eq('trainer_id', user.id)

    setWorkouts((workoutsData as any) || [])
    setClients(clientsData || [])
    setPlans(plansData || [])
    setLoading(false)
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = []
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from Monday of the first week
    const startDay = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    startDay.setDate(startDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    // Generate 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay)
      date.setDate(date.getDate() + i)

      const dateStr = date.toISOString().split('T')[0]
      const dayWorkouts = workouts.filter(w => w.scheduled_date === dateStr)

      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.getTime() === today.getTime(),
        workouts: dayWorkouts,
      })
    }

    return days
  }, [currentDate, workouts])

  const handleAddWorkout = async () => {
    if (!selectedDate || !formData.client_id) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await (supabase
      .from('scheduled_workouts') as any)
      .insert({
        trainer_id: user.id,
        client_id: formData.client_id,
        plan_id: formData.plan_id || null,
        scheduled_date: selectedDate,
        scheduled_time: formData.scheduled_time || null,
        notes: formData.notes || null,
      })

    if (!error) {
      setShowForm(false)
      setFormData({ client_id: '', plan_id: '', scheduled_time: '', notes: '' })
      loadData()
    }
  }

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento trénink?')) return

    const supabase = createClient()
    await (supabase.from('scheduled_workouts') as any).delete().eq('id', id)
    loadData()
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await (supabase.from('scheduled_workouts') as any).update({ status }).eq('id', id)
    loadData()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthName = currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kalendář tréninků</h1>
      </div>

      {/* Calendar header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold capitalize">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedDate(day.date.toISOString().split('T')[0])
                setShowForm(true)
              }}
              className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
                day.isCurrentMonth
                  ? day.isToday
                    ? 'bg-primary-50 border-primary-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isCurrentMonth
                  ? day.isToday
                    ? 'text-primary-600'
                    : 'text-gray-900'
                  : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>

              {/* Workouts for this day */}
              <div className="space-y-1">
                {day.workouts.slice(0, 3).map(workout => (
                  <div
                    key={workout.id}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-xs p-1 rounded truncate ${
                      workout.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : workout.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {workout.scheduled_time && (
                      <span className="font-medium">{workout.scheduled_time.slice(0, 5)} </span>
                    )}
                    {workout.client?.full_name || 'Klient'}
                  </div>
                ))}
                {day.workouts.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{day.workouts.length - 3} další
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add workout form modal */}
      {showForm && selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Naplánovat trénink - {new Date(selectedDate).toLocaleDateString('cs-CZ')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Klient *
                </label>
                <select
                  value={formData.client_id}
                  onChange={e => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Vyberte klienta</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name || client.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plán (volitelné)
                </label>
                <select
                  value={formData.plan_id}
                  onChange={e => setFormData(prev => ({ ...prev, plan_id: e.target.value }))}
                  className="input"
                >
                  <option value="">Bez plánu</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Čas
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={e => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poznámka
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormData({ client_id: '', plan_id: '', scheduled_time: '', notes: '' })
                }}
                className="flex-1 btn btn-secondary"
              >
                Zrušit
              </button>
              <button
                onClick={handleAddWorkout}
                disabled={!formData.client_id}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                Naplánovat
              </button>
            </div>

            {/* Existing workouts for selected date */}
            {workouts.filter(w => w.scheduled_date === selectedDate).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Tréninky v tento den:
                </h4>
                <div className="space-y-2">
                  {workouts
                    .filter(w => w.scheduled_date === selectedDate)
                    .map(workout => (
                      <div key={workout.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {workout.client?.full_name}
                            {workout.scheduled_time && ` - ${workout.scheduled_time.slice(0, 5)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {workout.plan?.name || 'Bez plánu'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={workout.status}
                            onChange={(e) => handleUpdateStatus(workout.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            {Object.entries(workoutStatusLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
