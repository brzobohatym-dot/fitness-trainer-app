'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ExerciseType,
  MuscleGroup,
  Difficulty,
  exerciseTypeLabels,
  muscleGroupLabels,
  difficultyLabels,
} from '@/types/database'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  publishedAt: string
}

export default function ImportExercisesPage() {
  const router = useRouter()
  const [channelUrl, setChannelUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channelTitle, setChannelTitle] = useState('')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())

  // Default values for imported exercises
  const [exerciseType, setExerciseType] = useState<ExerciseType>('strength')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('full_body')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')

  const fetchVideos = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setVideos([])
    setSelectedVideos(new Set())

    try {
      const response = await fetch(`/api/youtube/channel?url=${encodeURIComponent(channelUrl)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos')
      }

      setChannelTitle(data.channelTitle)
      setVideos(data.videos)
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání videí')
    } finally {
      setLoading(false)
    }
  }

  const toggleVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId)
    } else {
      newSelected.add(videoId)
    }
    setSelectedVideos(newSelected)
  }

  const selectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(videos.map((v) => v.id)))
    }
  }

  const importSelected = async () => {
    if (selectedVideos.size === 0) return

    setImporting(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Nejste přihlášeni')
      setImporting(false)
      return
    }

    const videosToImport = videos.filter((v) => selectedVideos.has(v.id))

    try {
      for (const video of videosToImport) {
        await (supabase.from('exercises') as any).insert({
          trainer_id: user.id,
          name: video.title,
          description: video.description?.substring(0, 500) || null,
          youtube_url: video.url,
          exercise_type: exerciseType,
          muscle_group: muscleGroup,
          difficulty: difficulty,
        })
      }

      router.push('/exercises')
      router.refresh()
    } catch (err: any) {
      setError('Chyba při importu cviků')
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import z YouTube</h1>
        <Link href="/exercises" className="btn btn-secondary">
          Zpět na cviky
        </Link>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Načíst videa z YouTube kanálu
        </h2>

        <form onSubmit={fetchVideos} className="flex gap-4">
          <input
            type="text"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="URL YouTube kanálu (např. https://www.youtube.com/@kanalname)"
            className="input flex-1"
            required
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Načítám...' : 'Načíst videa'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {videos.length > 0 && (
        <>
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Výchozí hodnoty pro importované cviky
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Typ cviku</label>
                <select
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
                <label className="label">Svalová skupina</label>
                <select
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
                <label className="label">Obtížnost</label>
                <select
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

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Videa z kanálu: {channelTitle}
                </h2>
                <p className="text-sm text-gray-500">
                  Vybráno: {selectedVideos.size} z {videos.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="btn btn-secondary">
                  {selectedVideos.size === videos.length
                    ? 'Zrušit výběr'
                    : 'Vybrat vše'}
                </button>
                <button
                  onClick={importSelected}
                  disabled={selectedVideos.size === 0 || importing}
                  className="btn btn-primary"
                >
                  {importing
                    ? 'Importuji...'
                    : `Importovat (${selectedVideos.size})`}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => toggleVideo(video.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedVideos.has(video.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video mb-2 rounded overflow-hidden bg-gray-100">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
