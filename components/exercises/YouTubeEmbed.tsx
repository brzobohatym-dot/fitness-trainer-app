'use client'

import { extractYouTubeId } from '@/lib/utils'

interface YouTubeEmbedProps {
  url: string
  title?: string
}

export default function YouTubeEmbed({ url, title = 'Video' }: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Neplatné YouTube URL</p>
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}
