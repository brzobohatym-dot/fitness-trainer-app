'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PricingPlan, Payment, Subscription, PricingInterval } from '@/types/database'
import { formatPrice } from '@/lib/comgate'

const intervalLabels: Record<PricingInterval, string> = {
  month: 'měsíčně',
  year: 'ročně',
  once: 'jednorázově',
}

export default function ClientPaymentsPage() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [trainerId, setTrainerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get client profile with trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('trainer_id')
      .eq('id', user.id)
      .single() as { data: any }

    if (!profile?.trainer_id) {
      setLoading(false)
      return
    }

    setTrainerId(profile.trainer_id)

    // Load data in parallel
    const [plansResult, paymentsResult, subscriptionResult] = await Promise.all([
      supabase
        .from('pricing_plans')
        .select('*')
        .eq('trainer_id', profile.trainer_id)
        .eq('is_active', true)
        .order('price'),
      supabase
        .from('payments')
        .select('*, pricing_plan:pricing_plans(*)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('subscriptions')
        .select('*, pricing_plan:pricing_plans(*)')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .single(),
    ])

    setPlans((plansResult.data as PricingPlan[]) || [])
    setPayments((paymentsResult.data as Payment[]) || [])
    setSubscription(subscriptionResult.data as Subscription | null)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePayment = async (planId: string) => {
    if (!trainerId) return

    setPaying(planId)

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricingPlanId: planId,
          trainerId,
        }),
      })

      const data = await response.json()

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        alert(data.error || 'Chyba při vytváření platby')
        setPaying(null)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Chyba při vytváření platby')
      setPaying(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('cs-CZ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Načítám...</p>
      </div>
    )
  }

  if (!trainerId) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Nemáte přiřazeného trenéra
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title mb-6">Platby</h1>

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Platba byla úspěšně provedena!
        </div>
      )}

      {cancelled && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-4 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Platba byla zrušena
        </div>
      )}

      {/* Current subscription */}
      {subscription && (
        <div className="card mb-6 border-2 border-green-500 dark:border-green-400">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Aktivní předplatné
            </h2>
          </div>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {subscription.pricing_plan?.name}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Platné do: {formatDate(subscription.current_period_end || '')}
          </p>
        </div>
      )}

      {/* Available plans */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Dostupné plány
      </h2>

      {plans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => (
            <div key={plan.id} className="card">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                {plan.name}
              </h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {formatPrice(plan.price)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /{intervalLabels[plan.interval]}
                </span>
              </p>
              {plan.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
              )}
              <button
                onClick={() => handlePayment(plan.id)}
                disabled={paying === plan.id}
                className="btn btn-primary w-full mt-4"
              >
                {paying === plan.id ? 'Přesměrovávám...' : 'Zaplatit'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8 mb-8">
          <p className="text-gray-500 dark:text-gray-400">
            Váš trenér zatím nemá nastavené cenové plány
          </p>
        </div>
      )}

      {/* Payment history */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Historie plateb
      </h2>

      {payments.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Datum</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Plán</th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">Částka</th>
                  <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Stav</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {payment.pricing_plan?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {payment.status === 'paid' ? 'Zaplaceno' : payment.status === 'pending' ? 'Čeká' : 'Neúspěšné'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Zatím nemáte žádné platby
          </p>
        </div>
      )}
    </div>
  )
}
