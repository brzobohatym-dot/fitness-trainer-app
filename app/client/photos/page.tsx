'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PhotoGallery from '@/components/client/PhotoGallery'
import { ProgressPhoto } from '@/types/database'

export default function ClientPhotosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])

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
        .from('progress_photos')
        .select('*')
        .eq('client_id', user.id)
        .order('taken_at', { ascending: false })

      setPhotos((data as ProgressPhoto[]) || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const handlePhotoAdded = (photo: ProgressPhoto) => {
    setPhotos(prev => [photo, ...prev])
  }

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Fotogalerie progresu
      </h1>

      {userId && (
        <PhotoGallery
          photos={photos}
          clientId={userId}
          onPhotoAdded={handlePhotoAdded}
          onPhotoDeleted={handlePhotoDeleted}
        />
      )}
    </div>
  )
}
