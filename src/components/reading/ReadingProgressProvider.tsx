'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useGuestSession } from '@/hooks/useGuestSession'
import type { BookProgress, BookmarkData } from '@/lib/progress-utils'

interface ReadingProgressContextType {
  updateProgress: (updates: Partial<BookProgress>) => void
  addBookmark: (bookmark: Omit<BookmarkData, 'id' | 'createdAt'>) => void
  currentProgress: BookProgress | null
  isLoading: boolean
  guestId: string | null
}

const ReadingProgressContext = createContext<ReadingProgressContextType | undefined>(undefined)

interface ReadingProgressProviderProps {
  children: React.ReactNode
  bookId: number
  chapterId: number
}

export function ReadingProgressProvider({ 
  children, 
  bookId, 
  chapterId 
}: ReadingProgressProviderProps) {
  const { 
    guestId, 
    saveReadingProgress, 
    getBookProgress,
    isLoading: sessionLoading 
  } = useGuestSession()

  const [currentProgress, setCurrentProgress] = useState<BookProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load current progress when component mounts
  useEffect(() => {
    const loadProgress = async () => {
      if (!guestId) return
      
      try {
        const progress = await getBookProgress(bookId)
        if (progress) {
          setCurrentProgress({
            bookId,
            currentChapter: progress.chapterId,
            currentPosition: progress.position,
            lastReadAt: progress.timestamp,
            timeSpent: 0, // Will be calculated from session data
            completed: false,
            startedAt: progress.timestamp,
          })
        }
      } catch (error) {
        console.error('Failed to load reading progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (guestId) {
      loadProgress()
    } else if (!sessionLoading) {
      setIsLoading(false)
    }
  }, [guestId, bookId, getBookProgress, sessionLoading])
  const updateProgress = (updates: Partial<BookProgress>) => {
    if (!guestId) return

    const newProgress = {
      ...currentProgress,
      ...updates,
      bookId,
      lastReadAt: new Date().toISOString(),
    } as BookProgress

    setCurrentProgress(newProgress)

    // Save to storage
    saveReadingProgress({
      bookId,
      chapterId: updates.currentChapter || chapterId,
      chapterSlug: '', // Will be updated by the chapter component
      position: updates.currentPosition || 0,
    }).catch(error => {
      console.error('Failed to save reading progress:', error)
    })
  }

  const addBookmark = (bookmark: Omit<BookmarkData, 'id' | 'createdAt'>) => {
    // TODO: Implement bookmark storage in guest session
    console.log('Adding bookmark:', bookmark)
  }

  // Track reading session start
  useEffect(() => {
    if (!guestId) return
    
    const startTime = Date.now()
    
    // Update progress when component mounts (user started reading)
    updateProgress({
      currentChapter: chapterId,
      currentPosition: 0,
    })

    // Track reading time when component unmounts
    return () => {
      const sessionTime = Math.round((Date.now() - startTime) / 60000) // Convert to minutes
      if (sessionTime > 0) {
        updateProgress({
          timeSpent: (currentProgress?.timeSpent || 0) + sessionTime,
        })
      }
    }
  }, [bookId, chapterId, guestId])

  const contextValue: ReadingProgressContextType = {
    updateProgress,
    addBookmark,
    currentProgress,
    isLoading: isLoading || sessionLoading,
    guestId,
  }

  return (
    <ReadingProgressContext.Provider value={contextValue}>
      {children}
    </ReadingProgressContext.Provider>
  )
}

export function useReadingProgress() {
  const context = useContext(ReadingProgressContext)
  if (context === undefined) {
    throw new Error('useReadingProgress must be used within a ReadingProgressProvider')
  }
  return context
}