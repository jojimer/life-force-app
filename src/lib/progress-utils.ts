/**
 * Utilities for managing user progress data
 */

export interface BookProgress {
  bookId: number
  currentChapter: number
  currentPosition: number // Character position or percentage
  lastReadAt: string
  timeSpent: number // Minutes spent reading
  completed: boolean
  startedAt: string
  completedAt?: string
}

export interface UserProgressData {
  books: Record<string, BookProgress>
  currentlyReading: number[]
  completed: number[]
  lastActivity: string | null
}

export interface BookmarkData {
  id: string
  bookId: number
  chapterId?: number
  position: number
  note?: string
  createdAt: string
  title?: string
}

export interface UserBookmarks {
  bookmarks: BookmarkData[]
  notes: Array<{
    id: string
    bookId: number
    chapterId?: number
    content: string
    position: number
    createdAt: string
  }>
  highlights: Array<{
    id: string
    bookId: number
    chapterId?: number
    text: string
    position: number
    color?: string
    createdAt: string
  }>
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  fontFamily: 'default' | 'serif' | 'sans-serif' | 'mono'
  readingSpeed: number // Words per minute
  notifications: {
    email: boolean
    reminders: boolean
    newBooks: boolean
    achievements: boolean
  }
  privacy: {
    shareProgress: boolean
    publicProfile: boolean
  }
}

/**
 * Create default progress structure for a new user
 */
export function createDefaultProgress(): UserProgressData {
  return {
    books: {},
    currentlyReading: [],
    completed: [],
    lastActivity: null,
  }
}

/**
 * Create default bookmarks structure
 */
export function createDefaultBookmarks(): UserBookmarks {
  return {
    bookmarks: [],
    notes: [],
    highlights: [],
  }
}

/**
 * Create default preferences
 */
export function createDefaultPreferences(): UserPreferences {
  return {
    theme: 'light',
    fontSize: 'medium',
    fontFamily: 'default',
    readingSpeed: 200,
    notifications: {
      email: true,
      reminders: false,
      newBooks: true,
      achievements: true,
    },
    privacy: {
      shareProgress: false,
      publicProfile: false,
    },
  }
}

/**
 * Update book progress
 */
export function updateBookProgress(
  currentProgress: UserProgressData,
  bookId: number,
  updates: Partial<BookProgress>
): UserProgressData {
  const bookKey = bookId.toString()
  const existingProgress = currentProgress.books[bookKey]

  const updatedBookProgress: BookProgress = {
    bookId,
    currentChapter: 1,
    currentPosition: 0,
    lastReadAt: new Date().toISOString(),
    timeSpent: 0,
    completed: false,
    startedAt: new Date().toISOString(),
    ...existingProgress,
    ...updates,
  }

  const updatedProgress = {
    ...currentProgress,
    books: {
      ...currentProgress.books,
      [bookKey]: updatedBookProgress,
    },
    lastActivity: new Date().toISOString(),
  }

  // Update currently reading list
  if (!updatedBookProgress.completed && !updatedProgress.currentlyReading.includes(bookId)) {
    updatedProgress.currentlyReading.push(bookId)
  }

  // Update completed list
  if (updatedBookProgress.completed) {
    updatedProgress.completed = [...new Set([...updatedProgress.completed, bookId])]
    updatedProgress.currentlyReading = updatedProgress.currentlyReading.filter(id => id !== bookId)
  }

  return updatedProgress
}

/**
 * Add bookmark
 */
export function addBookmark(
  currentBookmarks: UserBookmarks,
  bookmark: Omit<BookmarkData, 'id' | 'createdAt'>
): UserBookmarks {
  const newBookmark: BookmarkData = {
    ...bookmark,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  return {
    ...currentBookmarks,
    bookmarks: [...currentBookmarks.bookmarks, newBookmark],
  }
}

/**
 * Calculate reading statistics
 */
export function calculateReadingStats(progress: UserProgressData): {
  totalBooks: number
  completedBooks: number
  currentlyReading: number
  totalReadingTime: number
  averageReadingTime: number
} {
  const books = Object.values(progress.books)
  const completedBooks = books.filter(book => book.completed)
  const totalReadingTime = books.reduce((total, book) => total + book.timeSpent, 0)

  return {
    totalBooks: books.length,
    completedBooks: completedBooks.length,
    currentlyReading: progress.currentlyReading.length,
    totalReadingTime,
    averageReadingTime: completedBooks.length > 0 
      ? totalReadingTime / completedBooks.length 
      : 0,
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Validate progress data structure
 */
export function validateProgressData(data: any): data is UserProgressData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.books === 'object' &&
    Array.isArray(data.currentlyReading) &&
    Array.isArray(data.completed)
  )
}

/**
 * Merge progress data from multiple sources
 */
export function mergeProgressData(
  local: UserProgressData,
  remote: UserProgressData
): UserProgressData {
  const mergedBooks: Record<string, BookProgress> = { ...local.books }

  // Merge book progress, keeping the most recent data
  Object.entries(remote.books).forEach(([bookId, remoteProgress]) => {
    const localProgress = mergedBooks[bookId]
    
    if (!localProgress || new Date(remoteProgress.lastReadAt) > new Date(localProgress.lastReadAt)) {
      mergedBooks[bookId] = remoteProgress
    }
  })

  // Merge lists, removing duplicates
  const currentlyReading = [...new Set([...local.currentlyReading, ...remote.currentlyReading])]
  const completed = [...new Set([...local.completed, ...remote.completed])]

  // Remove completed books from currently reading
  const filteredCurrentlyReading = currentlyReading.filter(id => !completed.includes(id))

  return {
    books: mergedBooks,
    currentlyReading: filteredCurrentlyReading,
    completed,
    lastActivity: [local.lastActivity, remote.lastActivity]
      .filter(Boolean)
      .sort()
      .pop() || null,
  }
}