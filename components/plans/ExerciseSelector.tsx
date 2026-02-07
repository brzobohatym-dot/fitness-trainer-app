'use client'

import { useState } from 'react'
import {
  Exercise,
  exerciseTypeLabels,
  muscleGroupLabels,
} from '@/types/database'

interface ExerciseSelectorProps {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  excludeIds?: string[]
}

export default function ExerciseSelector({
  exercises,
  onSelect,
  onClose,
  excludeIds = [],
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredExercises = exercises.filter(
    (ex) =>
      !excludeIds.includes(ex.id) &&
      ex.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Vyberte cvik</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat cviky..."
            className="input"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredExercises.length > 0 ? (
            <div className="space-y-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => onSelect(exercise)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{exercise.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {exerciseTypeLabels[exercise.exercise_type]}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {muscleGroupLabels[exercise.muscle_group]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {search
                ? 'Žádné cviky neodpovídají hledání'
                : 'Všechny cviky jsou již v plánu'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
