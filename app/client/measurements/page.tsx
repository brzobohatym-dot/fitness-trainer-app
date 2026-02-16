'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BodyMeasurementForm from '@/components/client/BodyMeasurementForm'
import { BodyMeasurement } from '@/types/database'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function ClientMeasurementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('client_id', user.id)
        .order('measured_at', { ascending: false })

      setMeasurements((data as BodyMeasurement[]) || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleSaved = (measurement: BodyMeasurement) => {
    if (editingMeasurement) {
      setMeasurements(prev =>
        prev.map(m => m.id === measurement.id ? measurement : m)
      )
    } else {
      setMeasurements(prev => [measurement, ...prev])
    }
    setShowForm(false)
    setEditingMeasurement(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat toto měření?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', id)

    if (!error) {
      setMeasurements(prev => prev.filter(m => m.id !== id))
    }
  }

  // Prepare chart data (sorted by date ascending)
  const chartData = [...measurements]
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map(m => ({
      date: new Date(m.measured_at).toLocaleDateString('cs-CZ'),
      weight: m.body_weight,
      waist: m.waist_cm,
      chest: m.chest_cm,
    }))

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
        <h1 className="text-2xl font-bold text-gray-900">
          Měření těla
        </h1>
        <button
          onClick={() => {
            setEditingMeasurement(null)
            setShowForm(!showForm)
          }}
          className="btn btn-primary"
        >
          {showForm ? 'Zrušit' : '+ Přidat měření'}
        </button>
      </div>

      {/* Form */}
      {showForm && userId && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingMeasurement ? 'Upravit měření' : 'Nové měření'}
          </h2>
          <BodyMeasurementForm
            clientId={userId}
            onSaved={handleSaved}
            initialData={editingMeasurement}
          />
        </div>
      )}

      {/* Weight chart */}
      {chartData.length > 1 && chartData.some(d => d.weight) && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vývoj váhy
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" unit=" kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Váha"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ fill: '#4f46e5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Measurements list */}
      {measurements.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">Zatím nemáte žádná měření</p>
          <p className="text-sm text-gray-400">
            Přidejte první měření pro sledování progresu
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {measurements.map((m) => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(m.measured_at).toLocaleDateString('cs-CZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {m.body_weight && (
                    <p className="text-2xl font-bold text-primary-600 mt-1">
                      {m.body_weight} kg
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingMeasurement(m)
                      setShowForm(true)
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {m.chest_cm && (
                  <div>
                    <p className="text-gray-500">Hrudník</p>
                    <p className="font-medium">{m.chest_cm} cm</p>
                  </div>
                )}
                {m.waist_cm && (
                  <div>
                    <p className="text-gray-500">Pas</p>
                    <p className="font-medium">{m.waist_cm} cm</p>
                  </div>
                )}
                {m.hips_cm && (
                  <div>
                    <p className="text-gray-500">Boky</p>
                    <p className="font-medium">{m.hips_cm} cm</p>
                  </div>
                )}
                {(m.bicep_left_cm || m.bicep_right_cm) && (
                  <div>
                    <p className="text-gray-500">Bicepsy</p>
                    <p className="font-medium">
                      {m.bicep_left_cm || '-'} / {m.bicep_right_cm || '-'} cm
                    </p>
                  </div>
                )}
                {(m.thigh_left_cm || m.thigh_right_cm) && (
                  <div>
                    <p className="text-gray-500">Stehna</p>
                    <p className="font-medium">
                      {m.thigh_left_cm || '-'} / {m.thigh_right_cm || '-'} cm
                    </p>
                  </div>
                )}
              </div>

              {m.notes && (
                <p className="mt-4 text-sm text-gray-600 border-t pt-4">
                  {m.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
