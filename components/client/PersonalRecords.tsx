'use client'

import { useState } from 'react'
import { PersonalRecord, Exercise, muscleGroupLabels } from '@/types/database'

interface PersonalRecordsProps {
  records: (PersonalRecord & { exercise: Exercise })[]
}

export default function PersonalRecords({ records }: PersonalRecordsProps) {
  const [filter, setFilter] = useState<string>('all')

  // Group records by exercise and find best for each
  const bestRecords = records.reduce((acc, record) => {
    const exerciseId = record.exercise_id
    if (!acc[exerciseId] || (record.one_rep_max || 0) > (acc[exerciseId].one_rep_max || 0)) {
      acc[exerciseId] = record
    }
    return acc
  }, {} as Record<string, PersonalRecord & { exercise: Exercise }>)

  const recordsList = Object.values(bestRecords)

  // Get unique muscle groups
  const muscleGroups = Array.from(new Set(recordsList.map(r => r.exercise.muscle_group)))

  const filteredRecords = filter === 'all'
    ? recordsList
    : recordsList.filter(r => r.exercise.muscle_group === filter)

  // Sort by 1RM descending
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => (b.one_rep_max || 0) - (a.one_rep_max || 0)
  )

  if (records.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500 mb-2">Zatím nemáte žádné osobní rekordy</p>
        <p className="text-sm text-gray-400">
          Rekordy se automaticky ukládají při cvičení
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vše ({recordsList.length})
        </button>
        {muscleGroups.map(group => (
          <button
            key={group}
            onClick={() => setFilter(group)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === group
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {muscleGroupLabels[group as keyof typeof muscleGroupLabels]}
          </button>
        ))}
      </div>

      {/* Records list */}
      <div className="grid gap-4 md:grid-cols-2">
        {sortedRecords.map((record, index) => (
          <div
            key={record.id}
            className={`card relative overflow-hidden ${
              index === 0 ? 'ring-2 ring-yellow-400' : ''
            }`}
          >
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
                TOP PR
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                index === 0 ? 'bg-yellow-100' : 'bg-primary-100'
              }`}>
                <span className={`font-bold text-lg ${
                  index === 0 ? 'text-yellow-600' : 'text-primary-600'
                }`}>
                  #{index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {record.exercise.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {muscleGroupLabels[record.exercise.muscle_group as keyof typeof muscleGroupLabels]}
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-600">
                    {record.weight}
                  </span>
                  <span className="text-gray-500">kg</span>
                  <span className="text-gray-400">×</span>
                  <span className="text-xl font-semibold text-gray-700">
                    {record.reps}
                  </span>
                  <span className="text-gray-500">opak.</span>
                </div>

                {record.one_rep_max && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm">
                    <span className="font-medium">1RM:</span>
                    <span className="font-bold">{record.one_rep_max.toFixed(1)} kg</span>
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  {new Date(record.achieved_at).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100">
        <h3 className="font-semibold text-gray-900 mb-4">Souhrn</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-primary-600">
              {recordsList.length}
            </p>
            <p className="text-sm text-gray-600">Cviků s PR</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-600">
              {Math.max(...recordsList.map(r => r.weight))} kg
            </p>
            <p className="text-sm text-gray-600">Nejvyšší váha</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-600">
              {Math.max(...recordsList.map(r => r.one_rep_max || 0)).toFixed(0)} kg
            </p>
            <p className="text-sm text-gray-600">Nejvyšší 1RM</p>
          </div>
        </div>
      </div>
    </div>
  )
}
