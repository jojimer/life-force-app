'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Book, Chapter } from '@/payload-types'

interface ChapterNavigationProps {
  book: Book
  currentChapter: Chapter
  previousChapter: Chapter | null
  nextChapter: Chapter | null
  allChapters: Chapter[]
}

export function ChapterNavigation({
  book,
  currentChapter,
  previousChapter,
  nextChapter,
  allChapters
}: ChapterNavigationProps) {
  const [showChapterList, setShowChapterList] = useState(false)

  return (
    <div className="space-y-6">
      {/* Previous/Next Navigation */}
      <div className="flex items-center justify-between">
        {/* Previous Chapter */}
        <div className="flex-1">
          {previousChapter ? (
            <Link
              href={`/books/${book.slug}/chapters/${previousChapter.slug}`}
              className="group flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div>
                <div className="text-sm text-gray-500">Previous</div>
                <div className="font-medium">{previousChapter.title}</div>
              </div>
            </Link>
          ) : (
            <div className="text-gray-400">
              <div className="text-sm">Previous</div>
              <div className="font-medium">No previous chapter</div>
            </div>
          )}
        </div>

        {/* Chapter List Toggle */}
        <div className="flex-shrink-0 mx-8">
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-sm font-medium">All Chapters</span>
          </button>
        </div>

        {/* Next Chapter */}
        <div className="flex-1 text-right">
          {nextChapter ? (
            <Link
              href={`/books/${book.slug}/chapters/${nextChapter.slug}`}
              className="group inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm text-gray-500">Next</div>
                <div className="font-medium">{nextChapter.title}</div>
              </div>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="text-gray-400">
              <div className="text-sm">Next</div>
              <div className="font-medium">End of book</div>
            </div>
          )}
        </div>
      </div>

      {/* Chapter List */}
      {showChapterList && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Chapters</h3>
            <button
              onClick={() => setShowChapterList(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {allChapters.map((chapter, index) => {
              const isCurrent = chapter.id === currentChapter.id
              
              return (
                <Link
                  key={chapter.id}
                  href={`/books/${book.slug}/chapters/${chapter.slug}`}
                  className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'hover:bg-white hover:shadow-sm border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {chapter.chapterNumber || index + 1}
                    </div>
                    <div>
                      <h4 className={`font-medium ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>
                        {chapter.title}
                      </h4>
                      {chapter.summary && (
                        <p className={`text-sm mt-1 line-clamp-1 ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                          {chapter.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`text-xs ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                    {chapter.estimatedReadingTime && `${chapter.estimatedReadingTime}m`}
                    {isCurrent && (
                      <span className="ml-2 px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                        Current
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Reading Progress</span>
          <span className="text-sm text-gray-500">
            Chapter {currentChapter.chapterNumber || 1} of {allChapters.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((allChapters.findIndex(ch => ch.id === currentChapter.id) + 1) / allChapters.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Back to Book */}
      <div className="text-center pt-6 border-t border-gray-200">
        <Link
          href={`/books/${book.slug}`}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Back to Book Details
        </Link>
      </div>
    </div>
  )
}