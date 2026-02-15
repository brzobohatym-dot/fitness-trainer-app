'use client'

import { useState } from 'react'

interface PreWorkoutFormProps {
  onSubmit: (data: {
    fatigue_level: number
    muscle_pain: number
    mood: number
    notes: string
  }) => void
  loading?: boolean
}

const RATING_OPTIONS = [
  { value: 1, label: '1', description: 'Výborný' },
  { value: 2, label: '2', description: 'Dobrý' },
  { value: 3, label: '3', description: 'Průměrný' },
  { value: 4, label: '4', description: 'Horší' },
  { value: 5, label: '5', description: 'Špatný' },
]

export default function PreWorkoutForm({ onSubmit, loading }: PreWorkoutFormProps) {
  const [fatigueLevel, setFatigueLevel] = useState<number | null>(null)
  const [musclePain, setMusclePain] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fatigueLevel && musclePain && mood) {
      onSubmit({
        fatigue_level: fatigueLevel,
        muscle_pain: musclePain,
        mood: mood,
        notes: notes,
      })
    }
  }

  const isValid = fatigueLevel !== null && musclePain !== null && mood !== null

  const RatingSelector = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string
    description: string
    value: number | null
    onChange: (val: number) => void
  }) => (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <div className="flex gap-2">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 py-3 px-2 rounded-xl text-center font-bold transition-all ${
              value === option.value
                ? 'bg-primary-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{option.label}</span>
            <span className="block text-xs font-normal mt-1 opacity-75">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="card max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Jak se dnes cítíš?
        </h2>
        <p className="text-gray-600 text-sm">
          Vyplň krátký dotazník před začátkem tréninku
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <RatingSelector
          label="Únava"
          description="Jak moc se cítíš unavený/á? (1 = vůbec ne, 5 = velmi)"
          value={fatigueLevel}
          onChange={setFatigueLevel}
        />

        <RatingSelector
          label="Bolest svalů"
          description="Máš bolesti nebo napětí ve svalech? (1 = žádné, 5 = silné)"
          value={musclePain}
          onChange={setMusclePain}
        />

        <RatingSelector
          label="Nálada"
          description="Jaká je tvoje nálada? (1 = výborná, 5 = špatná)"
          value={mood}
          onChange={setMood}
        />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Poznámka (volitelné)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input h-20"
            placeholder="Něco, co by měl trenér vědět..."
          />
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Ukládám...' : 'Začít trénink'}
        </button>
      </form>
    </div>
  )
}
