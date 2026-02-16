'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BodyMeasurement } from '@/types/database'

interface BodyMeasurementFormProps {
  clientId: string
  onSaved: (measurement: BodyMeasurement) => void
  initialData?: BodyMeasurement | null
}

export default function BodyMeasurementForm({
  clientId,
  onSaved,
  initialData,
}: BodyMeasurementFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(initialData?.file_url || null)
  const [fileName, setFileName] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    measured_at: initialData?.measured_at || new Date().toISOString().split('T')[0],
    body_weight: initialData?.body_weight?.toString() || '',
    chest_cm: initialData?.chest_cm?.toString() || '',
    waist_cm: initialData?.waist_cm?.toString() || '',
    hips_cm: initialData?.hips_cm?.toString() || '',
    bicep_left_cm: initialData?.bicep_left_cm?.toString() || '',
    bicep_right_cm: initialData?.bicep_right_cm?.toString() || '',
    thigh_left_cm: initialData?.thigh_left_cm?.toString() || '',
    thigh_right_cm: initialData?.thigh_right_cm?.toString() || '',
    notes: initialData?.notes || '',
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Soubor je příliš velký (max 10MB)')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const filePath = `${clientId}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('measurement-files')
      .upload(filePath, file)

    if (uploadError) {
      setError('Chyba při nahrávání: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('measurement-files')
      .getPublicUrl(filePath)

    setFileUrl(publicUrl)
    setFileName(file.name)
    setUploading(false)
  }

  const handleRemoveFile = async () => {
    if (!fileUrl) return

    const supabase = createClient()
    const urlParts = fileUrl.split('/measurement-files/')
    if (urlParts[1]) {
      await supabase.storage.from('measurement-files').remove([urlParts[1]])
    }

    setFileUrl(null)
    setFileName(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const data = {
      client_id: clientId,
      measured_at: formData.measured_at,
      body_weight: formData.body_weight ? parseFloat(formData.body_weight) : null,
      chest_cm: formData.chest_cm ? parseFloat(formData.chest_cm) : null,
      waist_cm: formData.waist_cm ? parseFloat(formData.waist_cm) : null,
      hips_cm: formData.hips_cm ? parseFloat(formData.hips_cm) : null,
      bicep_left_cm: formData.bicep_left_cm ? parseFloat(formData.bicep_left_cm) : null,
      bicep_right_cm: formData.bicep_right_cm ? parseFloat(formData.bicep_right_cm) : null,
      thigh_left_cm: formData.thigh_left_cm ? parseFloat(formData.thigh_left_cm) : null,
      thigh_right_cm: formData.thigh_right_cm ? parseFloat(formData.thigh_right_cm) : null,
      notes: formData.notes || null,
      file_url: fileUrl,
    }

    let result
    if (initialData?.id) {
      result = await (supabase
        .from('body_measurements') as any)
        .update(data)
        .eq('id', initialData.id)
        .select()
        .single()
    } else {
      result = await (supabase
        .from('body_measurements') as any)
        .insert(data)
        .select()
        .single()
    }

    if (result.error) {
      setError(result.error.message)
    } else if (result.data) {
      onSaved(result.data as BodyMeasurement)
    }

    setLoading(false)
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Datum měření
        </label>
        <input
          type="date"
          value={formData.measured_at}
          onChange={e => updateField('measured_at', e.target.value)}
          className="input"
          required
        />
      </div>

      {/* Body weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tělesná váha (kg)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={formData.body_weight}
          onChange={e => updateField('body_weight', e.target.value)}
          className="input"
          placeholder="např. 75.5"
        />
      </div>

      {/* Measurements grid */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Obvody (cm)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hrudník
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.chest_cm}
              onChange={e => updateField('chest_cm', e.target.value)}
              className="input"
              placeholder="cm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pas
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.waist_cm}
              onChange={e => updateField('waist_cm', e.target.value)}
              className="input"
              placeholder="cm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boky
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.hips_cm}
              onChange={e => updateField('hips_cm', e.target.value)}
              className="input"
              placeholder="cm"
            />
          </div>

          <div className="col-span-2 border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Bicepsy</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Levý
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.bicep_left_cm}
                  onChange={e => updateField('bicep_left_cm', e.target.value)}
                  className="input"
                  placeholder="cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pravý
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.bicep_right_cm}
                  onChange={e => updateField('bicep_right_cm', e.target.value)}
                  className="input"
                  placeholder="cm"
                />
              </div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Stehna</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Levé
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.thigh_left_cm}
                  onChange={e => updateField('thigh_left_cm', e.target.value)}
                  className="input"
                  placeholder="cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pravé
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.thigh_right_cm}
                  onChange={e => updateField('thigh_right_cm', e.target.value)}
                  className="input"
                  placeholder="cm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Poznámky
        </label>
        <textarea
          value={formData.notes}
          onChange={e => updateField('notes', e.target.value)}
          className="input"
          rows={3}
          placeholder="Volitelné poznámky..."
        />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Příloha (volitelné)
        </label>
        {fileUrl ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName || 'Nahraný soubor'}
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline"
              >
                Zobrazit soubor
              </a>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            {uploading && (
              <p className="text-sm text-gray-500 mt-2">Nahrávám...</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              PDF, Word, Excel, obrázky (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn btn-primary"
      >
        {loading ? 'Ukládám...' : initialData ? 'Aktualizovat' : 'Uložit měření'}
      </button>
    </form>
  )
}
