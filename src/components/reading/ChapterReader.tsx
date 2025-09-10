'use client'

import { useEffect, useRef, useState } from 'react'
import { useReadingProgress } from './ReadingProgressProvider'
import type { Chapter, Book } from '@/payload-types'

interface ChapterReaderProps {
  chapter: Chapter
  book: Book
}

export function ChapterReader({ chapter, book }: ChapterReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium')
  const [fontFamily, setFontFamily] = useState<'default' | 'serif' | 'sans-serif'>('default')
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  const { updateProgress, addBookmark } = useReadingProgress()

  // Font size classes
  const fontSizeClasses = {
    small: 'text-base leading-relaxed',
    medium: 'text-lg leading-relaxed',
    large: 'text-xl leading-relaxed',
    'extra-large': 'text-2xl leading-relaxed'
  }

  // Font family classes
  const fontFamilyClasses = {
    default: 'font-sans',
    serif: 'font-serif',
    'sans-serif': 'font-sans'
  }

  // Theme classes
  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-900'
  }

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('reading-preferences')
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences)
        setFontSize(prefs.fontSize || 'medium')
        setFontFamily(prefs.fontFamily || 'default')
        setTheme(prefs.theme || 'light')
      } catch (error) {
        console.error('Error loading reading preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const savePreferences = (newPrefs: any) => {
    const preferences = {
      fontSize,
      fontFamily,
      theme,
      ...newPrefs
    }
    localStorage.setItem('reading-preferences', JSON.stringify(preferences))
  }

  // Handle font size change
  const handleFontSizeChange = (newSize: typeof fontSize) => {
    setFontSize(newSize)
    savePreferences({ fontSize: newSize })
  }

  // Handle font family change
  const handleFontFamilyChange = (newFamily: typeof fontFamily) => {
    setFontFamily(newFamily)
    savePreferences({ fontFamily: newFamily })
  }

  // Handle theme change
  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme)
    savePreferences({ theme: newTheme })
  }

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const element = contentRef.current
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = element.scrollHeight - window.innerHeight
      const scrollPercent = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))

      // Update progress every 5% increment
      if (scrollPercent % 5 < 1) {
        updateProgress({
          currentChapter: chapter.chapterNumber || 1,
          currentPosition: Math.round(scrollPercent),
          timeSpent: 1, // Add 1 minute of reading time
        })
      }
    }

    const throttledScroll = throttle(handleScroll, 1000) // Throttle to once per second
    window.addEventListener('scroll', throttledScroll)
    return () => window.removeEventListener('scroll', throttledScroll)
  }, [chapter, updateProgress])

  // Add bookmark functionality
  const handleAddBookmark = () => {
    if (!contentRef.current) return
    
    const scrollPercent = Math.round(
      ((window.pageYOffset || document.documentElement.scrollTop) / 
       (contentRef.current.scrollHeight - window.innerHeight)) * 100
    )

    addBookmark({
      bookId: book.id,
      chapterId: chapter.id,
      position: scrollPercent,
      title: `${chapter.title} - ${scrollPercent}%`,
      note: `Bookmark in ${chapter.title}`,
    })

    // Show confirmation
    alert('Bookmark added!')
  }

  // Render chapter content
  const renderContent = () => {
    if (typeof chapter.content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
    }

    // Handle Lexical/rich text content
    if (chapter.content && typeof chapter.content === 'object') {
      return <div dangerouslySetInnerHTML={{ __html: JSON.stringify(chapter.content) }} />
    }

    return <p>No content available for this chapter.</p>
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
      {/* Reading Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Reading Settings</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Font Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
              <div className="grid grid-cols-2 gap-2">
                {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      fontSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Font Family</label>
              <div className="grid grid-cols-3 gap-2">
                {(['default', 'serif', 'sans-serif'] as const).map((family) => (
                  <button
                    key={family}
                    onClick={() => handleFontFamilyChange(family)}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      fontFamily === family
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {family === 'default' ? 'Default' : family === 'serif' ? 'Serif' : 'Sans'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'sepia'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => handleThemeChange(themeOption)}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      theme === themeOption
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed right-4 bottom-4 flex flex-col space-y-2 z-40">
        <button
          onClick={handleAddBookmark}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Add Bookmark"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Reading Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Chapter Content */}
      <div
        ref={contentRef}
        className={`prose prose-lg max-w-none mx-auto px-4 py-8 ${fontSizeClasses[fontSize]} ${fontFamilyClasses[fontFamily]}`}
        style={{ maxWidth: '65ch' }}
      >
        {renderContent()}
      </div>
    </div>
  )
}

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}