'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Exercise, ExerciseLog, muscleGroupLabels } from '@/types/database'

interface ProgressChartsProps {
  exerciseLogs: (ExerciseLog & {
    plan_exercise: {
      exercise: Exercise
    }
  })[]
  exercises: Exercise[]
}

interface ChartDataPoint {
  date: string
  weight: number
  reps: number
  volume: number
}

export default function ProgressCharts({ exerciseLogs, exercises }: ProgressChartsProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [chartType, setChartType] = useState<'weight' | 'volume'>('weight')

  // Group exercises by muscle group
  const exercisesByGroup = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    exercises.forEach(ex => {
      if (!groups[ex.muscle_group]) {
        groups[ex.muscle_group] = []
      }
      groups[ex.muscle_group].push(ex)
    })
    return groups
  }, [exercises])

  // Process data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return []

    const filteredLogs = exerciseLogs.filter(
      log => log.plan_exercise?.exercise?.id === selectedExercise
    )

    // Group by date and find max weight/volume per day
    const byDate: Record<string, { weights: number[], reps: number[], volumes: number[] }> = {}

    filteredLogs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('cs-CZ')
      if (!byDate[date]) {
        byDate[date] = { weights: [], reps: [], volumes: [] }
      }
      byDate[date].weights.push(log.weight)
      byDate[date].reps.push(log.reps_completed || 0)
      byDate[date].volumes.push(log.weight * (log.reps_completed || 0))
    })

    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        weight: Math.max(...data.weights),
        reps: Math.max(...data.reps),
        volume: data.volumes.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('. ').map(Number)
        const [dayB, monthB, yearB] = b.date.split('. ').map(Number)
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
      })
  }, [selectedExercise, exerciseLogs])

  const selectedExerciseName = exercises.find(e => e.id === selectedExercise)?.name || ''

  if (exercises.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Zatím nemáte žádné zaznamenané cviky</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Exercise selector */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vyberte cvik</h3>
        <div className="space-y-4">
          {Object.entries(exercisesByGroup).map(([group, exs]) => (
            <div key={group}>
              <p className="text-sm font-medium text-gray-500 mb-2">
                {muscleGroupLabels[group as keyof typeof muscleGroupLabels] || group}
              </p>
              <div className="flex flex-wrap gap-2">
                {exs.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedExercise === ex.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {selectedExercise && chartData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedExerciseName}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('weight')}
                className={`px-3 py-1 rounded text-sm ${
                  chartType === 'weight'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Max. váha
              </button>
              <button
                onClick={() => setChartType('volume')}
                className={`px-3 py-1 rounded text-sm ${
                  chartType === 'volume'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Objem
              </button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  unit={chartType === 'weight' ? ' kg' : ' kg'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [
                    `${value} kg`,
                    chartType === 'weight' ? 'Max. váha' : 'Objem',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={chartType}
                  name={chartType === 'weight' ? 'Max. váha' : 'Objem'}
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ fill: '#4f46e5', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {Math.max(...chartData.map(d => d.weight))} kg
              </p>
              <p className="text-sm text-gray-500">Nejvyšší váha</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {chartData.length}
              </p>
              <p className="text-sm text-gray-500">Tréninků</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {chartData.length > 1
                  ? `${(chartData[chartData.length - 1].weight - chartData[0].weight > 0 ? '+' : '')}${(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1)} kg`
                  : '—'}
              </p>
              <p className="text-sm text-gray-500">Progres</p>
            </div>
          </div>
        </div>
      )}

      {selectedExercise && chartData.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            Pro tento cvik zatím nemáte žádné záznamy
          </p>
        </div>
      )}
    </div>
  )
}
