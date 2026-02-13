import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import ExerciseCard from '@/components/exercises/ExerciseCard'
import {
  ExerciseType,
  MuscleGroup,
  Difficulty,
  exerciseTypeLabels,
  muscleGroupLabels,
  difficultyLabels,
} from '@/types/database'

interface ExercisesPageProps {
  searchParams: {
    type?: ExerciseType
    muscle?: MuscleGroup
    difficulty?: Difficulty
    search?: string
  }
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || ''

  let query = supabase
    .from('exercises')
    .select('*')
    .eq('trainer_id', userId)
    .order('created_at', { ascending: false })

  if (searchParams.type) {
    query = query.eq('exercise_type', searchParams.type)
  }
  if (searchParams.muscle) {
    query = query.eq('muscle_group', searchParams.muscle)
  }
  if (searchParams.difficulty) {
    query = query.eq('difficulty', searchParams.difficulty)
  }
  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  const { data: exercises } = await query as { data: any[] | null }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cviky</h1>
        <Link href="/exercises/new" className="btn btn-primary">
          + Přidat cvik
        </Link>
      </div>

      <div className="card mb-6">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Hledat cviky..."
              className="input"
            />
          </div>

          <select
            name="type"
            defaultValue={searchParams.type || ''}
            className="input w-auto"
          >
            <option value="">Všechny typy</option>
            {Object.entries(exerciseTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            name="muscle"
            defaultValue={searchParams.muscle || ''}
            className="input w-auto"
          >
            <option value="">Všechny svaly</option>
            {Object.entries(muscleGroupLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            name="difficulty"
            defaultValue={searchParams.difficulty || ''}
            className="input w-auto"
          >
            <option value="">Všechny obtížnosti</option>
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-secondary">
            Filtrovat
          </button>
        </form>
      </div>

      {exercises && exercises.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchParams.search ||
            searchParams.type ||
            searchParams.muscle ||
            searchParams.difficulty
              ? 'Žádné cviky neodpovídají filtrům'
              : 'Zatím nemáte žádné cviky'}
          </p>
          <Link href="/exercises/new" className="btn btn-primary">
            Vytvořit první cvik
          </Link>
        </div>
      )}
    </div>
  )
}
