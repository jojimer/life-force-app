'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUserProgress } from '@/hooks/useUserProgress'
import type { BookProgress, BookmarkData } from '@/lib/progress-utils'

interface ReadingProgressContextType {
  updateProgress: (updates: Partial<BookProgress>) => void
  addBookmark: (bookmark: Omit<BookmarkData, 'id' | 'createdAt'>) => void
  currentProgress: BookProgress | null
  isLoading: boolean
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
  const [guestId] = useState(() => {
    // Generate or retrieve guest ID
    let id = localStorage.getItem('guestId')
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('guestId', id)
    }
    return id
  })

  const {
    progress,
    updateProgress: updateUserProgress,
    addBookmark: addUserBookmark,
    isLoading
  } = useUserProgress({
    guestId,
    autoSync: false, // Don't auto-sync during reading for performance
  })

  const currentProgress = progress.books[bookId.toString()] || null

  const updateProgress = (updates: Partial<BookProgress>) => {
    updateUserProgress(bookId, {
      ...updates,
      lastReadAt: new Date().toISOString(),
    })
  }

  const addBookmark = (bookmark: Omit<BookmarkData, 'id' | 'createdAt'>) => {
    addUserBookmark(bookmark)
  }

  // Track reading session start
  useEffect(() => {
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
  }, [bookId, chapterId])

  const contextValue: ReadingProgressContextType = {
    updateProgress,
    addBookmark,
    currentProgress,
    isLoading,
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