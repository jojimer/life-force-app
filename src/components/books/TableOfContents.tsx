'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Chapter } from '@/payload-types'

interface TableOfContentsProps {
  chapters: Chapter[]
  bookSlug: string
  maxVisible?: number
}

export function TableOfContents({ chapters, bookSlug, maxVisible = 10 }: TableOfContentsProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleChapters = showAll ? chapters : chapters.slice(0, maxVisible)
  const hasMore = chapters.length > maxVisible

  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="space-y-2">
      {visibleChapters.map((chapter, index) => (
        <div
          key={chapter.id}
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              {chapter.chapterNumber || index + 1}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <Link
                href={`/books/${bookSlug}/chapters/${chapter.slug}`}
                className="block"
              >
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {chapter.title}
                </h3>
                {chapter.summary && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {chapter.summary}
                  </p>
                )}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-500 ml-4">
            {chapter.wordCount && (
              <span className="hidden sm:inline">
                {chapter.wordCount.toLocaleString()} words
              </span>
            )}
            {chapter.estimatedReadingTime && (
              <span>
                {formatReadingTime(chapter.estimatedReadingTime)}
              </span>
            )}
            <svg 
              className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
        >
          {showAll ? (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show Less
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show All {chapters.length} Chapters
            </>
          )}
        </button>
      )}
    </div>
  )
}