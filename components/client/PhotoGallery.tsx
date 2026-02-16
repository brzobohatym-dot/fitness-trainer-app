'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ProgressPhoto, photoTypeLabels } from '@/types/database'

interface PhotoGalleryProps {
  photos: ProgressPhoto[]
  clientId: string
  onPhotoAdded: (photo: ProgressPhoto) => void
  onPhotoDeleted: (photoId: string) => void
}

export default function PhotoGallery({
  photos,
  clientId,
  onPhotoAdded,
  onPhotoDeleted,
}: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    photo_type: 'front' as 'front' | 'back' | 'side' | 'other',
    taken_at: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vyberte prosím obrázek')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Obrázek je příliš velký (max 5MB)')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = createClient()

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${clientId}/${Date.now()}.${fileExt}`

    const { data: storageData, error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(fileName, file)

    if (uploadError) {
      setError('Chyba při nahrávání: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(fileName)

    // Save to database
    const { data: photoData, error: dbError } = await (supabase
      .from('progress_photos') as any)
      .insert({
        client_id: clientId,
        photo_url: publicUrl,
        photo_type: uploadData.photo_type,
        taken_at: uploadData.taken_at,
        notes: uploadData.notes || null,
      })
      .select()
      .single()

    if (dbError) {
      setError('Chyba při ukládání: ' + dbError.message)
    } else if (photoData) {
      onPhotoAdded(photoData as ProgressPhoto)
      setShowUploadForm(false)
      setUploadData({
        photo_type: 'front',
        taken_at: new Date().toISOString().split('T')[0],
        notes: '',
      })
    }

    setUploading(false)
  }

  const handleDelete = async (photo: ProgressPhoto) => {
    if (!confirm('Opravdu chcete smazat tuto fotku?')) return

    const supabase = createClient()

    // Extract file path from URL
    const urlParts = photo.photo_url.split('/progress-photos/')
    if (urlParts[1]) {
      await supabase.storage.from('progress-photos').remove([urlParts[1]])
    }

    const { error } = await (supabase
      .from('progress_photos') as any)
      .delete()
      .eq('id', photo.id)

    if (!error) {
      onPhotoDeleted(photo.id)
      setSelectedPhoto(null)
    }
  }

  // Group photos by month
  const photosByMonth = photos.reduce((acc, photo) => {
    const date = new Date(photo.taken_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {} as Record<string, ProgressPhoto[]>)

  const sortedMonths = Object.keys(photosByMonth).sort().reverse()

  return (
    <div className="space-y-6">
      {/* Upload button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="btn btn-primary"
        >
          {showUploadForm ? 'Zrušit' : '+ Přidat fotku'}
        </button>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Nahrát novou fotku</h3>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ fotky
                </label>
                <select
                  value={uploadData.photo_type}
                  onChange={e => setUploadData(prev => ({
                    ...prev,
                    photo_type: e.target.value as any
                  }))}
                  className="input"
                >
                  {Object.entries(photoTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={uploadData.taken_at}
                  onChange={e => setUploadData(prev => ({
                    ...prev,
                    taken_at: e.target.value
                  }))}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poznámka (volitelné)
              </label>
              <input
                type="text"
                value={uploadData.notes}
                onChange={e => setUploadData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                className="input"
                placeholder="např. Po 3 měsících tréninku"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vybrat fotku
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">Nahrávám...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {photos.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">Zatím nemáte žádné fotky</p>
          <p className="text-sm text-gray-400">
            Přidejte fotky svého progresu
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map(month => {
            const [year, monthNum] = month.split('-')
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('cs-CZ', {
              month: 'long',
              year: 'numeric',
            })

            return (
              <div key={month}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {monthName}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photosByMonth[month].map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-gray-100"
                    >
                      <img
                        src={photo.photo_url}
                        alt={photoTypeLabels[photo.photo_type]}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs font-medium">
                          {photoTypeLabels[photo.photo_type]}
                        </p>
                        <p className="text-white/80 text-xs">
                          {new Date(photo.taken_at).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedPhoto.photo_url}
                alt={photoTypeLabels[selectedPhoto.photo_type]}
                className="w-full max-h-[70vh] object-contain bg-gray-100"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {photoTypeLabels[selectedPhoto.photo_type]}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedPhoto.taken_at).toLocaleDateString('cs-CZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {selectedPhoto.notes && (
                    <p className="text-sm text-gray-600 mt-2">{selectedPhoto.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(selectedPhoto)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
