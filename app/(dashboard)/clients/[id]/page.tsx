'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, TrainingPlan, ClientPlan } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface ClientPageProps {
  params: {
    id: string
  }
}

export default function ClientPage({ params }: ClientPageProps) {
  const router = useRouter()
  const [client, setClient] = useState<Profile | null>(null)
  const [clientPlans, setClientPlans] = useState<(ClientPlan & { plan: TrainingPlan })[]>([])
  const [availablePlans, setAvailablePlans] = useState<TrainingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const [clientResult, plansResult, clientPlansResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .eq('trainer_id', user?.id)
        .single(),
      supabase
        .from('training_plans')
        .select('*')
        .eq('trainer_id', user?.id)
        .order('name'),
      supabase
        .from('client_plans')
        .select('*, plan:training_plans(*)')
        .eq('client_id', params.id)
        .order('assigned_at', { ascending: false }),
    ])

    setClient(clientResult.data)
    setAvailablePlans(plansResult.data || [])
    setClientPlans((clientPlansResult.data as any) || [])
    setLoading(false)
  }

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanId) return

    setAssigning(true)
    const supabase = createClient()

    const { error } = await supabase.from('client_plans').insert({
      plan_id: selectedPlanId,
      client_id: params.id,
      start_date: startDate || null,
      end_date: endDate || null,
    })

    if (!error) {
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
                  Přiřadit
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
          </form>
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
    </div>
  )
}
