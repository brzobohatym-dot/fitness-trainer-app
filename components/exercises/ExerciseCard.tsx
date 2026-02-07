import Link from 'next/link'
import Image from 'next/image'
import {
  Exercise,
  exerciseTypeLabels,
  muscleGroupLabels,
  difficultyLabels,
} from '@/types/database'
import { getYouTubeThumbnail } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const thumbnail = exercise.youtube_url
    ? getYouTubeThumbnail(exercise.youtube_url)
    : null

  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="card hover:shadow-md transition-shadow group"
    >
      {thumbnail ? (
        <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={thumbnail}
            alt={exercise.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      ) : (
        <div className="aspect-video mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">🏋️</span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {exercise.name}
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {exerciseTypeLabels[exercise.exercise_type]}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {muscleGroupLabels[exercise.muscle_group]}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {difficultyLabels[exercise.difficulty]}
        </span>
      </div>

      {exercise.description && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {exercise.description}
        </p>
      )}
    </Link>
  )
}
