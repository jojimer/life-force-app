/**
 * Custom hook for handling media uploads with progress tracking
 */
'use client'

import { useState, useCallback } from 'react'
import { validateFile } from '../lib/storage-config'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UseMediaUploadOptions {
  onSuccess?: (media: any) => void
  onError?: (error: string) => void
  onProgress?: (progress: UploadProgress) => void
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File, metadata?: {
    alt?: string
    caption?: string
    type?: string
    tags?: string[]
  }) => {
    setIsUploading(true)
    setError(null)
    setProgress(null)

    try {
      // Validate file
      const validation = validateFile({
        mimeType: file.type,
        size: file.size,
      })

      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      // Add metadata
      if (metadata?.alt) formData.append('alt', metadata.alt)
      if (metadata?.caption) formData.append('caption', metadata.caption)
      if (metadata?.type) formData.append('type', metadata.type)
      if (metadata?.tags) {
        formData.append('tags', JSON.stringify(metadata.tags.map(tag => ({ tag }))))
      }

      // Upload with progress tracking
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const result = await response.json()
      
      setProgress({ loaded: file.size, total: file.size, percentage: 100 })
      options.onSuccess?.(result.doc)
      
      return result.doc
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      options.onError?.(errorMessage)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [options])

  const uploadMultiple = useCallback(async (files: File[], metadata?: {
    type?: string
    tags?: string[]
  }) => {
    const results = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i]
        const result = await uploadFile(file, {
          ...metadata,
          alt: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
        })
        results.push(result)
      } catch (err) {
        errors.push({ file: files[i].name, error: err })
      }
    }

    return { results, errors }
  }, [uploadFile])

  return {
    uploadFile,
    uploadMultiple,
    isUploading,
    progress,
    error,
    clearError: () => setError(null),
  }
}