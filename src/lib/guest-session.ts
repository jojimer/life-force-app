/**
 * Guest session management utilities
 * Handles UUID generation and storage across web and mobile platforms
 */

export interface GuestSession {
  id: string
  createdAt: string
  lastActiveAt: string
  platform: 'web' | 'mobile'
  deviceInfo?: {
    userAgent?: string
    platform?: string
    version?: string
  }
}

export interface ReadingPosition {
  bookId: number
  chapterId: number
  chapterSlug: string
  position: number // Scroll percentage or character position
  timestamp: string
}

export interface GuestProgress {
  guestId: string
  currentlyReading: ReadingPosition[]
  bookProgress: Record<string, {
    bookId: number
    currentChapter: number
    currentPosition: number
    lastReadAt: string
    timeSpent: number // minutes
    completed: boolean
    startedAt: string
    completedAt?: string
  }>
  bookmarks: Array<{
    id: string
    bookId: number
    chapterId: number
    position: number
    note?: string
    createdAt: string
    title?: string
  }>
  preferences: {
    theme: 'light' | 'dark' | 'sepia'
    fontSize: 'small' | 'medium' | 'large' | 'extra-large'
    fontFamily: 'default' | 'serif' | 'sans-serif'
    readingSpeed: number
  }
  statistics: {
    totalBooksStarted: number
    totalBooksCompleted: number
    totalReadingTime: number // minutes
    averageSessionTime: number // minutes
    longestStreak: number // days
    currentStreak: number // days
  }
}

/**
 * Generate a unique guest ID
 */
export function generateGuestId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const additionalRandom = Math.random().toString(36).substring(2, 15)
  return `guest_${timestamp}_${randomPart}${additionalRandom}`
}

/**
 * Check if we're running in a Capacitor environment (mobile)
 */
export function isCapacitorEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         window.Capacitor !== undefined
}

/**
 * Storage interface for cross-platform compatibility
 */
export class GuestStorage {
  private static instance: GuestStorage
  private isInitialized = false

  static getInstance(): GuestStorage {
    if (!GuestStorage.instance) {
      GuestStorage.instance = new GuestStorage()
    }
    return GuestStorage.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    if (isCapacitorEnvironment()) {
      await this.initializeCapacitor()
    } else {
      await this.initializeWeb()
    }
    
    this.isInitialized = true
  }

  private async initializeCapacitor(): Promise<void> {
    // Initialize SQLite database for mobile
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      // Create database if it doesn't exist
      await CapacitorSQLite.createConnection({
        database: 'lifeforce_books.db',
        version: 1,
        encrypted: false,
        mode: 'no-encryption'
      })

      // Create tables
      await this.createTables()
    } catch (error) {
      console.error('Failed to initialize Capacitor SQLite:', error)
      // Fallback to localStorage
      console.log('Falling back to localStorage')
    }
  }

  private async initializeWeb(): Promise<void> {
    // Initialize IndexedDB for web
    if (typeof window === 'undefined') return

    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported')
      }

      await this.initializeIndexedDB()
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      // Fallback to localStorage
      console.log('Falling back to localStorage')
    }
  }

  private async createTables(): Promise<void> {
    if (!isCapacitorEnvironment()) return

    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS guest_sessions (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          last_active_at TEXT NOT NULL,
          platform TEXT NOT NULL,
          device_info TEXT
        );

        CREATE TABLE IF NOT EXISTS reading_progress (
          guest_id TEXT NOT NULL,
          book_id INTEGER NOT NULL,
          chapter_id INTEGER NOT NULL,
          chapter_slug TEXT NOT NULL,
          position INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          PRIMARY KEY (guest_id, book_id)
        );

        CREATE TABLE IF NOT EXISTS book_progress (
          guest_id TEXT NOT NULL,
          book_id INTEGER NOT NULL,
          current_chapter INTEGER NOT NULL,
          current_position INTEGER NOT NULL,
          last_read_at TEXT NOT NULL,
          time_spent INTEGER DEFAULT 0,
          completed INTEGER DEFAULT 0,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          PRIMARY KEY (guest_id, book_id)
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
          id TEXT PRIMARY KEY,
          guest_id TEXT NOT NULL,
          book_id INTEGER NOT NULL,
          chapter_id INTEGER NOT NULL,
          position INTEGER NOT NULL,
          note TEXT,
          title TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS preferences (
          guest_id TEXT PRIMARY KEY,
          theme TEXT DEFAULT 'light',
          font_size TEXT DEFAULT 'medium',
          font_family TEXT DEFAULT 'default',
          reading_speed INTEGER DEFAULT 200
        );

        CREATE TABLE IF NOT EXISTS statistics (
          guest_id TEXT PRIMARY KEY,
          total_books_started INTEGER DEFAULT 0,
          total_books_completed INTEGER DEFAULT 0,
          total_reading_time INTEGER DEFAULT 0,
          average_session_time INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          current_streak INTEGER DEFAULT 0
        );
      `

      await CapacitorSQLite.execute({
        database: 'lifeforce_books.db',
        statements: createTablesSQL
      })
    } catch (error) {
      console.error('Failed to create tables:', error)
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LifeForceBooks', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Guest sessions store
        if (!db.objectStoreNames.contains('guestSessions')) {
          db.createObjectStore('guestSessions', { keyPath: 'id' })
        }

        // Reading progress store
        if (!db.objectStoreNames.contains('readingProgress')) {
          const progressStore = db.createObjectStore('readingProgress', { keyPath: ['guestId', 'bookId'] })
          progressStore.createIndex('guestId', 'guestId', { unique: false })
        }

        // Book progress store
        if (!db.objectStoreNames.contains('bookProgress')) {
          const bookProgressStore = db.createObjectStore('bookProgress', { keyPath: ['guestId', 'bookId'] })
          bookProgressStore.createIndex('guestId', 'guestId', { unique: false })
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'id' })
          bookmarksStore.createIndex('guestId', 'guestId', { unique: false })
        }

        // Preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'guestId' })
        }

        // Statistics store
        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'guestId' })
        }
      }
    })
  }

  /**
   * Get or create guest session
   */
  async getOrCreateGuestSession(): Promise<GuestSession> {
    await this.initialize()

    // Try to get existing session from storage
    let guestId = await this.getStoredGuestId()
    
    if (!guestId) {
      // Create new guest session
      guestId = generateGuestId()
      const session: GuestSession = {
        id: guestId,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        platform: isCapacitorEnvironment() ? 'mobile' : 'web',
        deviceInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
        }
      }

      await this.storeGuestSession(session)
      return session
    }

    // Update last active time
    const session = await this.getGuestSession(guestId)
    if (session) {
      session.lastActiveAt = new Date().toISOString()
      await this.storeGuestSession(session)
      return session
    }

    // Fallback: create new session if existing one is corrupted
    return this.getOrCreateGuestSession()
  }

  private async getStoredGuestId(): Promise<string | null> {
    if (isCapacitorEnvironment()) {
      return this.getGuestIdFromSQLite()
    } else {
      return this.getGuestIdFromIndexedDB() || this.getGuestIdFromLocalStorage()
    }
  }

  private async getGuestIdFromSQLite(): Promise<string | null> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      const result = await CapacitorSQLite.query({
        database: 'lifeforce_books.db',
        statement: 'SELECT id FROM guest_sessions ORDER BY last_active_at DESC LIMIT 1',
        values: []
      })

      return result.values && result.values.length > 0 ? result.values[0].id : null
    } catch (error) {
      console.error('Failed to get guest ID from SQLite:', error)
      return null
    }
  }

  private async getGuestIdFromIndexedDB(): Promise<string | null> {
    try {
      const db = await this.openIndexedDB()
      const transaction = db.transaction(['guestSessions'], 'readonly')
      const store = transaction.objectStore('guestSessions')
      
      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const sessions = request.result
          if (sessions && sessions.length > 0) {
            // Get most recent session
            const mostRecent = sessions.sort((a, b) => 
              new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
            )[0]
            resolve(mostRecent.id)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to get guest ID from IndexedDB:', error)
      return null
    }
  }

  private getGuestIdFromLocalStorage(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('guestId')
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LifeForceBooks', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async storeGuestSession(session: GuestSession): Promise<void> {
    if (isCapacitorEnvironment()) {
      await this.storeGuestSessionInSQLite(session)
    } else {
      await this.storeGuestSessionInIndexedDB(session)
    }

    // Always store in localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestId', session.id)
      localStorage.setItem('guestSession', JSON.stringify(session))
    }
  }

  private async storeGuestSessionInSQLite(session: GuestSession): Promise<void> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      await CapacitorSQLite.executeSet({
        database: 'lifeforce_books.db',
        set: [{
          statement: `INSERT OR REPLACE INTO guest_sessions 
                     (id, created_at, last_active_at, platform, device_info) 
                     VALUES (?, ?, ?, ?, ?)`,
          values: [
            session.id,
            session.createdAt,
            session.lastActiveAt,
            session.platform,
            JSON.stringify(session.deviceInfo)
          ]
        }]
      })
    } catch (error) {
      console.error('Failed to store guest session in SQLite:', error)
    }
  }

  private async storeGuestSessionInIndexedDB(session: GuestSession): Promise<void> {
    try {
      const db = await this.openIndexedDB()
      const transaction = db.transaction(['guestSessions'], 'readwrite')
      const store = transaction.objectStore('guestSessions')
      
      return new Promise((resolve, reject) => {
        const request = store.put(session)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to store guest session in IndexedDB:', error)
    }
  }

  async getGuestSession(guestId: string): Promise<GuestSession | null> {
    if (isCapacitorEnvironment()) {
      return this.getGuestSessionFromSQLite(guestId)
    } else {
      return this.getGuestSessionFromIndexedDB(guestId) || this.getGuestSessionFromLocalStorage()
    }
  }

  private async getGuestSessionFromSQLite(guestId: string): Promise<GuestSession | null> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      const result = await CapacitorSQLite.query({
        database: 'lifeforce_books.db',
        statement: 'SELECT * FROM guest_sessions WHERE id = ?',
        values: [guestId]
      })

      if (result.values && result.values.length > 0) {
        const row = result.values[0]
        return {
          id: row.id,
          createdAt: row.created_at,
          lastActiveAt: row.last_active_at,
          platform: row.platform,
          deviceInfo: row.device_info ? JSON.parse(row.device_info) : undefined
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get guest session from SQLite:', error)
      return null
    }
  }

  private async getGuestSessionFromIndexedDB(guestId: string): Promise<GuestSession | null> {
    try {
      const db = await this.openIndexedDB()
      const transaction = db.transaction(['guestSessions'], 'readonly')
      const store = transaction.objectStore('guestSessions')
      
      return new Promise((resolve, reject) => {
        const request = store.get(guestId)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to get guest session from IndexedDB:', error)
      return null
    }
  }

  private getGuestSessionFromLocalStorage(): GuestSession | null {
    if (typeof window === 'undefined') return null
    
    const sessionData = localStorage.getItem('guestSession')
    if (sessionData) {
      try {
        return JSON.parse(sessionData)
      } catch (error) {
        console.error('Failed to parse guest session from localStorage:', error)
      }
    }
    
    return null
  }

  /**
   * Save reading progress
   */
  async saveReadingProgress(guestId: string, progress: ReadingPosition): Promise<void> {
    if (isCapacitorEnvironment()) {
      await this.saveReadingProgressToSQLite(guestId, progress)
    } else {
      await this.saveReadingProgressToIndexedDB(guestId, progress)
    }

    // Also save to localStorage as backup
    if (typeof window !== 'undefined') {
      const key = `reading_progress_${guestId}`
      const existing = localStorage.getItem(key)
      let progressData: ReadingPosition[] = []
      
      if (existing) {
        try {
          progressData = JSON.parse(existing)
        } catch (error) {
          console.error('Failed to parse existing progress:', error)
        }
      }

      // Update or add progress for this book
      const existingIndex = progressData.findIndex(p => p.bookId === progress.bookId)
      if (existingIndex >= 0) {
        progressData[existingIndex] = progress
      } else {
        progressData.push(progress)
      }

      localStorage.setItem(key, JSON.stringify(progressData))
    }
  }

  private async saveReadingProgressToSQLite(guestId: string, progress: ReadingPosition): Promise<void> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      await CapacitorSQLite.executeSet({
        database: 'lifeforce_books.db',
        set: [{
          statement: `INSERT OR REPLACE INTO reading_progress 
                     (guest_id, book_id, chapter_id, chapter_slug, position, timestamp) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
          values: [
            guestId,
            progress.bookId,
            progress.chapterId,
            progress.chapterSlug,
            progress.position,
            progress.timestamp
          ]
        }]
      })
    } catch (error) {
      console.error('Failed to save reading progress to SQLite:', error)
    }
  }

  private async saveReadingProgressToIndexedDB(guestId: string, progress: ReadingPosition): Promise<void> {
    try {
      const db = await this.openIndexedDB()
      const transaction = db.transaction(['readingProgress'], 'readwrite')
      const store = transaction.objectStore('readingProgress')
      
      const progressWithGuestId = { guestId, ...progress }
      
      return new Promise((resolve, reject) => {
        const request = store.put(progressWithGuestId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to save reading progress to IndexedDB:', error)
    }
  }

  /**
   * Get reading progress for a guest
   */
  async getReadingProgress(guestId: string): Promise<ReadingPosition[]> {
    let progress: ReadingPosition[] = []

    if (isCapacitorEnvironment()) {
      progress = await this.getReadingProgressFromSQLite(guestId)
    } else {
      progress = await this.getReadingProgressFromIndexedDB(guestId)
    }

    // Fallback to localStorage
    if (progress.length === 0 && typeof window !== 'undefined') {
      const key = `reading_progress_${guestId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          progress = JSON.parse(stored)
        } catch (error) {
          console.error('Failed to parse reading progress from localStorage:', error)
        }
      }
    }

    return progress
  }

  private async getReadingProgressFromSQLite(guestId: string): Promise<ReadingPosition[]> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      const result = await CapacitorSQLite.query({
        database: 'lifeforce_books.db',
        statement: 'SELECT * FROM reading_progress WHERE guest_id = ? ORDER BY timestamp DESC',
        values: [guestId]
      })

      if (result.values) {
        return result.values.map(row => ({
          bookId: row.book_id,
          chapterId: row.chapter_id,
          chapterSlug: row.chapter_slug,
          position: row.position,
          timestamp: row.timestamp
        }))
      }

      return []
    } catch (error) {
      console.error('Failed to get reading progress from SQLite:', error)
      return []
    }
  }

  private async getReadingProgressFromIndexedDB(guestId: string): Promise<ReadingPosition[]> {
    try {
      const db = await this.openIndexedDB()
      const transaction = db.transaction(['readingProgress'], 'readonly')
      const store = transaction.objectStore('readingProgress')
      const index = store.index('guestId')
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(guestId)
        request.onsuccess = () => {
          const results = request.result || []
          resolve(results.map(item => ({
            bookId: item.bookId,
            chapterId: item.chapterId,
            chapterSlug: item.chapterSlug,
            position: item.position,
            timestamp: item.timestamp
          })))
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to get reading progress from IndexedDB:', error)
      return []
    }
  }

  /**
   * Clear all guest data (for privacy/reset)
   */
  async clearGuestData(guestId: string): Promise<void> {
    if (isCapacitorEnvironment()) {
      await this.clearGuestDataFromSQLite(guestId)
    } else {
      await this.clearGuestDataFromIndexedDB(guestId)
    }

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestId')
      localStorage.removeItem('guestSession')
      localStorage.removeItem(`reading_progress_${guestId}`)
    }
  }

  private async clearGuestDataFromSQLite(guestId: string): Promise<void> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
      
      const statements = [
        'DELETE FROM guest_sessions WHERE id = ?',
        'DELETE FROM reading_progress WHERE guest_id = ?',
        'DELETE FROM book_progress WHERE guest_id = ?',
        'DELETE FROM bookmarks WHERE guest_id = ?',
        'DELETE FROM preferences WHERE guest_id = ?',
        'DELETE FROM statistics WHERE guest_id = ?'
      ]

      for (const statement of statements) {
        await CapacitorSQLite.executeSet({
          database: 'lifeforce_books.db',
          set: [{ statement, values: [guestId] }]
        })
      }
    } catch (error) {
      console.error('Failed to clear guest data from SQLite:', error)
    }
  }

  private async clearGuestDataFromIndexedDB(guestId: string): Promise<void> {
    try {
      const db = await this.openIndexedDB()
      const storeNames = ['guestSessions', 'readingProgress', 'bookProgress', 'bookmarks', 'preferences', 'statistics']
      
      for (const storeName of storeNames) {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        if (storeName === 'guestSessions') {
          await new Promise<void>((resolve, reject) => {
            const request = store.delete(guestId)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        } else {
          // For other stores, delete by guestId index
          const index = store.index('guestId')
          const request = index.openCursor(guestId)
          
          await new Promise<void>((resolve, reject) => {
            request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result
              if (cursor) {
                cursor.delete()
                cursor.continue()
              } else {
                resolve()
              }
            }
            request.onerror = () => reject(request.error)
          })
        }
      }
    } catch (error) {
      console.error('Failed to clear guest data from IndexedDB:', error)
    }
  }
}