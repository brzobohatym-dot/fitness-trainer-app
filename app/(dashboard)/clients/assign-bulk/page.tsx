'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, TrainingPlan } from '@/types/database'

export default function BulkAssignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<Profile[]>([])
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null }

      if (profile?.role !== 'trainer') {
        router.push('/client')
        return
      }

      // Load clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('role', 'client')
        .order('full_name')

      // Load plans
      const { data: plansData } = await supabase
        .from('training_plans')
        .select('*')
        .eq('trainer_id', user.id)
        .order('name')

      setClients(clientsData || [])
      setPlans(plansData || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const selectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(c => c.id))
    }
  }

  const handleSubmit = async () => {
    if (selectedClients.length === 0 || !selectedPlan) return

    setSubmitting(true)
    const supabase = createClient()

    // Create client_plans for each selected client
    const assignments = selectedClients.map(clientId => ({
      client_id: clientId,
      plan_id: selectedPlan,
      start_date: startDate || null,
      end_date: endDate || null,
    }))

    const { error } = await (supabase
      .from('client_plans') as any)
      .insert(assignments)

    if (!error) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/clients')
      }, 2000)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Plán byl přiřazen
          </h2>
          <p className="text-gray-500">
            Plán byl úspěšně přiřazen {selectedClients.length} klientům.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hromadné přiřazení plánu
          </h1>
          <p className="text-gray-500 mt-1">
            Přiřaďte tréninkový plán více klientům najednou
          </p>
        </div>
        <Link href="/clients" className="btn btn-secondary">
          ← Zpět
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Select plan */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Vyberte plán
          </h2>

          {plans.length === 0 ? (
            <p className="text-gray-500">Nemáte žádné plány</p>
          ) : (
            <div className="space-y-2">
              {plans.map(plan => (
                <label
                  key={plan.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    {plan.description && (
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Date range */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Období (volitelné)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Od</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Do</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Select clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Vyberte klienty
            </h2>
            <button
              onClick={selectAll}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {selectedClients.length === clients.length ? 'Odznačit vše' : 'Vybrat vše'}
            </button>
          </div>

          {clients.length === 0 ? (
            <p className="text-gray-500">Nemáte žádné klienty</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clients.map(client => (
                <label
                  key={client.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClients.includes(client.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => toggleClient(client.id)}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {client.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {client.full_name || 'Bez jména'}
                      </p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            Vybráno: {selectedClients.length} z {clients.length} klientů
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={selectedClients.length === 0 || !selectedPlan || submitting}
          className="w-full btn btn-primary py-3 disabled:opacity-50"
        >
          {submitting
            ? 'Přiřazuji...'
            : `Přiřadit plán ${selectedClients.length} klientům`}
        </button>
      </div>
    </div>
  )
}
