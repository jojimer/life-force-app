'use client'

import { useState, useEffect, useCallback } from 'react'
import { GuestStorage, type GuestSession, type ReadingPosition } from '../lib/guest-session'

interface UseGuestSessionOptions {
  autoInitialize?: boolean
}

export function useGuestSession({ autoInitialize = true }: UseGuestSessionOptions = {}) {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storage = GuestStorage.getInstance()

  // Initialize guest session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const session = await storage.getOrCreateGuestSession()
      setGuestSession(session)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize guest session'
      setError(errorMessage)
      console.error('Guest session initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [storage])

  // Save reading progress
  const saveReadingProgress = useCallback(async (progress: Omit<ReadingPosition, 'timestamp'>) => {
    if (!guestSession) {
      throw new Error('Guest session not initialized')
    }

    try {
      const fullProgress: ReadingPosition = {
        ...progress,
        timestamp: new Date().toISOString()
      }

      await storage.saveReadingProgress(guestSession.id, fullProgress)
    } catch (err) {
      console.error('Failed to save reading progress:', err)
      throw err
    }
  }, [guestSession, storage])

  // Get reading progress
  const getReadingProgress = useCallback(async (): Promise<ReadingPosition[]> => {
    if (!guestSession) {
      throw new Error('Guest session not initialized')
    }

    try {
      return await storage.getReadingProgress(guestSession.id)
    } catch (err) {
      console.error('Failed to get reading progress:', err)
      return []
    }
  }, [guestSession, storage])

  // Get progress for specific book
  const getBookProgress = useCallback(async (bookId: number): Promise<ReadingPosition | null> => {
    const allProgress = await getReadingProgress()
    return allProgress.find(p => p.bookId === bookId) || null
  }, [getReadingProgress])

  // Clear all guest data
  const clearGuestData = useCallback(async () => {
    if (!guestSession) return

    try {
      await storage.clearGuestData(guestSession.id)
      setGuestSession(null)
      // Re-initialize with new session
      await initializeSession()
    } catch (err) {
      console.error('Failed to clear guest data:', err)
      throw err
    }
  }, [guestSession, storage, initializeSession])

  // Update session activity
  const updateActivity = useCallback(async () => {
    if (!guestSession) return

    try {
      const updatedSession = {
        ...guestSession,
        lastActiveAt: new Date().toISOString()
      }
      
      await storage.storeGuestSession(updatedSession)
      setGuestSession(updatedSession)
    } catch (err) {
      console.error('Failed to update session activity:', err)
    }
  }, [guestSession, storage])

  // Initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initializeSession()
    }
  }, [autoInitialize, initializeSession])

  // Update activity periodically
  useEffect(() => {
    if (!guestSession) return

    const interval = setInterval(updateActivity, 5 * 60 * 1000) // Every 5 minutes
    return () => clearInterval(interval)
  }, [guestSession, updateActivity])

  return {
    // State
    guestSession,
    isLoading,
    error,

    // Actions
    initializeSession,
    saveReadingProgress,
    getReadingProgress,
    getBookProgress,
    clearGuestData,
    updateActivity,

    // Utilities
    guestId: guestSession?.id || null,
    isInitialized: !!guestSession,
  }
}