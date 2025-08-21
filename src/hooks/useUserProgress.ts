'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserProgressData, BookProgress, UserBookmarks, UserPreferences } from '../lib/progress-utils'
import { 
  createDefaultProgress, 
  createDefaultBookmarks, 
  createDefaultPreferences,
  updateBookProgress,
  validateProgressData,
  mergeProgressData
} from '../lib/progress-utils'

interface UseUserProgressOptions {
  guestId: string
  email?: string
  autoSync?: boolean
  syncInterval?: number // Minutes
}

export function useUserProgress({
  guestId,
  email,
  autoSync = true,
  syncInterval = 5
}: UseUserProgressOptions) {
  const [progress, setProgress] = useState<UserProgressData>(createDefaultProgress())
  const [bookmarks, setBookmarks] = useState<UserBookmarks>(createDefaultBookmarks())
  const [preferences, setPreferences] = useState<UserPreferences>(createDefaultPreferences())
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load initial data from localStorage
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const localProgress = localStorage.getItem(`progress_${guestId}`)
        const localBookmarks = localStorage.getItem(`bookmarks_${guestId}`)
        const localPreferences = localStorage.getItem(`preferences_${guestId}`)

        if (localProgress) {
          const parsedProgress = JSON.parse(localProgress)
          if (validateProgressData(parsedProgress)) {
            setProgress(parsedProgress)
          }
        }

        if (localBookmarks) {
          setBookmarks(JSON.parse(localBookmarks))
        }

        if (localPreferences) {
          setPreferences(JSON.parse(localPreferences))
        }
      } catch (err) {
        console.error('Error loading local progress data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadLocalData()
  }, [guestId])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`progress_${guestId}`, JSON.stringify(progress))
    }
  }, [progress, guestId, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`bookmarks_${guestId}`, JSON.stringify(bookmarks))
    }
  }, [bookmarks, guestId, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`preferences_${guestId}`, JSON.stringify(preferences))
    }
  }, [preferences, guestId, isLoading])

  // Sync with server
  const syncWithServer = useCallback(async (force = false) => {
    if (!email || (!force && isSyncing)) return

    setIsSyncing(true)
    setError(null)

    try {
      // First, try to get existing user progress
      const response = await fetch(`/api/user-progress?email=${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const serverData = await response.json()
        
        if (serverData.docs && serverData.docs.length > 0) {
          const userProgress = serverData.docs[0]
          
          // Merge server data with local data
          const mergedProgress = mergeProgressData(progress, userProgress.progress)
          
          setProgress(mergedProgress)
          if (userProgress.bookmarks) setBookmarks(userProgress.bookmarks)
          if (userProgress.preferences) setPreferences(userProgress.preferences)
        }
      }

      // Update server with current data
      const updateResponse = await fetch('/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          guestId,
          progress,
          bookmarks,
          preferences,
          deviceInfo: {
            platform: 'web',
            userAgent: navigator.userAgent,
            appVersion: '1.0.0',
          },
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to sync with server')
      }

      setLastSyncAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      console.error('Sync error:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [email, progress, bookmarks, preferences, guestId, isSyncing])

  // Auto-sync setup
  useEffect(() => {
    if (!autoSync || !email) return

    const interval = setInterval(() => {
      syncWithServer()
    }, syncInterval * 60 * 1000) // Convert minutes to milliseconds

    return () => clearInterval(interval)
  }, [autoSync, email, syncInterval, syncWithServer])

  // Update book progress
  const updateProgress = useCallback((bookId: number, updates: Partial<BookProgress>) => {
    setProgress(current => updateBookProgress(current, bookId, updates))
  }, [])

  // Add bookmark
  const addBookmark = useCallback((bookmark: {
    bookId: number
    chapterId?: number
    position: number
    note?: string
    title?: string
  }) => {
    setBookmarks(current => ({
      ...current,
      bookmarks: [...current.bookmarks, {
        ...bookmark,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }],
    }))
  }, [])

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(current => ({ ...current, ...updates }))
  }, [])

  // Request email verification
  const requestVerification = useCallback(async (userEmail: string) => {
    try {
      const response = await fetch('/api/user-progress/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          guestId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send verification email')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification request failed')
      return false
    }
  }, [guestId])

  return {
    // Data
    progress,
    bookmarks,
    preferences,
    
    // State
    isLoading,
    isSyncing,
    lastSyncAt,
    error,
    
    // Actions
    updateProgress,
    addBookmark,
    updatePreferences,
    syncWithServer,
    requestVerification,
    
    // Utilities
    clearError: () => setError(null),
  }
}