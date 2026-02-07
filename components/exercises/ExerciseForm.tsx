'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import YouTubeEmbed from './YouTubeEmbed'
import {
  Exercise,
  ExerciseType,
  MuscleGroup,
  Difficulty,
  exerciseTypeLabels,
  muscleGroupLabels,
  difficultyLabels,
} from '@/types/database'

interface ExerciseFormProps {
  exercise?: Exercise
  trainerId: string
}

export default function ExerciseForm({ exercise, trainerId }: ExerciseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(exercise?.name || '')
  const [description, setDescription] = useState(exercise?.description || '')
  const [youtubeUrl, setYoutubeUrl] = useState(exercise?.youtube_url || '')
  const [exerciseType, setExerciseType] = useState<ExerciseType>(
    exercise?.exercise_type || 'strength'
  )
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    exercise?.muscle_group || 'full_body'
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(
    exercise?.difficulty || 'beginner'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const data = {
      name,
      description: description || null,
      youtube_url: youtubeUrl || null,
      exercise_type: exerciseType,
      muscle_group: muscleGroup,
      difficulty,
      trainer_id: trainerId,
    }

    if (exercise) {
      const { error } = await (supabase
        .from('exercises') as any)
        .update(data)
        .eq('id', exercise.id)

      if (error) {
        setError('Chyba při ukládání cviku')
        setLoading(false)
        return
      }
    } else {
      const { error } = await (supabase.from('exercises') as any).insert(data)

      if (error) {
        setError('Chyba při vytváření cviku')
        setLoading(false)
        return
      }
    }

    router.push('/exercises')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!exercise) return
    if (!confirm('Opravdu chcete smazat tento cvik?')) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await (supabase
      .from('exercises') as any)
      .delete()
      .eq('id', exercise.id)

    if (error) {
      setError('Chyba při mazání cviku')
      setLoading(false)
      return
    }

    router.push('/exercises')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="label">
              Název cviku *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input mt-1"
              placeholder="např. Dřepy s činkou"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Popis
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input mt-1 h-32"
              placeholder="Popište jak správně provádět cvik..."
            />
          </div>

          <div>
            <label htmlFor="youtubeUrl" className="label">
              YouTube URL
            </label>
            <input
              id="youtubeUrl"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="input mt-1"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="exerciseType" className="label">
                Typ cviku
              </label>
              <select
                id="exerciseType"
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
                className="input mt-1"
              >
                {Object.entries(exerciseTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="muscleGroup" className="label">
                Svalová skupina
              </label>
              <select
                id="muscleGroup"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                className="input mt-1"
              >
                {Object.entries(muscleGroupLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="label">
                Obtížnost
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="input mt-1"
              >
                {Object.entries(difficultyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="label mb-2 block">Náhled videa</label>
          {youtubeUrl ? (
            <YouTubeEmbed url={youtubeUrl} title={name} />
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Vložte YouTube URL pro náhled</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Ukládám...' : exercise ? 'Uložit změny' : 'Vytvořit cvik'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          Zrušit
        </button>
        {exercise && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger ml-auto"
          >
            Smazat cvik
          </button>
        )}
      </div>
    </form>
  )
}
