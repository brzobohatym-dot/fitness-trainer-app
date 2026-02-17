'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PricingPlan, PricingInterval } from '@/types/database'
import { formatPrice } from '@/lib/comgate'

const intervalLabels: Record<PricingInterval, string> = {
  month: 'měsíčně',
  year: 'ročně',
  once: 'jednorázově',
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [interval, setInterval] = useState<PricingInterval>('month')
  const [saving, setSaving] = useState(false)

  const loadPlans = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false }) as { data: PricingPlan[] | null }

    setPlans(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setInterval('month')
    setEditingPlan(null)
    setShowForm(false)
  }

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan)
    setName(plan.name)
    setDescription(plan.description || '')
    setPrice(plan.price.toString())
    setInterval(plan.interval)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const planData = {
      name,
      description: description || null,
      price: parseFloat(price),
      interval,
      trainer_id: user.id,
    }

    if (editingPlan) {
      await (supabase.from('pricing_plans') as any)
        .update(planData)
        .eq('id', editingPlan.id)
    } else {
      await (supabase.from('pricing_plans') as any)
        .insert(planData)
    }

    resetForm()
    loadPlans()
    setSaving(false)
  }

  const handleToggleActive = async (plan: PricingPlan) => {
    const supabase = createClient()
    await (supabase.from('pricing_plans') as any)
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id)
    loadPlans()
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Opravdu chcete smazat tento cenový plán?')) return

    const supabase = createClient()
    await supabase.from('pricing_plans').delete().eq('id', planId)
    loadPlans()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Načítám...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Cenové plány</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Nový plán
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingPlan ? 'Upravit plán' : 'Nový cenový plán'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Název plánu</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="např. Základní měsíční"
                  required
                />
              </div>
              <div>
                <label className="label">Cena (Kč)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                  placeholder="např. 1500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Popis</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Co je zahrnuto v tomto plánu..."
              />
            </div>

            <div>
              <label className="label">Typ platby</label>
              <div className="flex gap-4 mt-2">
                {(['month', 'year', 'once'] as PricingInterval[]).map((int) => (
                  <label
                    key={int}
                    className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                      interval === int
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interval"
                      value={int}
                      checked={interval === int}
                      onChange={() => setInterval(int)}
                      className="sr-only"
                    />
                    <span className={`font-medium ${interval === int ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {intervalLabels[int]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Ukládám...' : editingPlan ? 'Uložit změny' : 'Vytvořit plán'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {plans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card ${!plan.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {plan.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    plan.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {plan.is_active ? 'Aktivní' : 'Neaktivní'}
                  </span>
                </div>
              </div>

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

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 btn btn-secondary text-sm py-2"
                >
                  Upravit
                </button>
                <button
                  onClick={() => handleToggleActive(plan)}
                  className="flex-1 btn btn-secondary text-sm py-2"
                >
                  {plan.is_active ? 'Deaktivovat' : 'Aktivovat'}
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="btn btn-danger text-sm py-2 px-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Zatím nemáte žádné cenové plány
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Vytvořit první plán
          </button>
        </div>
      )}
    </div>
  )
}
