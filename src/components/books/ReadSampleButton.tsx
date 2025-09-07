'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ReadSampleButtonProps {
  bookSlug: string
  chapterSlug: string
  chapterTitle: string
}

export function ReadSampleButton({ bookSlug, chapterSlug, chapterTitle }: ReadSampleButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/books/${bookSlug}/chapters/${chapterSlug}`}
      className="w-full inline-flex items-center justify-center px-4 py-3 border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg 
        className={`w-5 h-5 mr-2 transition-transform duration-200 ${isHovered ? 'translate-x-1' : ''}`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      Read Sample
      <span className="ml-2 text-sm text-gray-500 group-hover:text-blue-500 transition-colors">
        ({chapterTitle})
      </span>
    </Link>
  )
}